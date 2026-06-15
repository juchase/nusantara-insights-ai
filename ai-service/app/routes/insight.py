import uuid
import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db
from app.services.aggregation_service import aggregate_product_metrics, calculate_sentiment_trend
from app.services.health_score_service import calculate_health_score, get_health_label
from app.services.prompt_builder import build_prompt
from app.services.llm_service import safe_generate
from app.services.insight_engine import generate_structured_insights, generate_executive_summary
from datetime import datetime

router = APIRouter()

@router.get("/generate-insight/{product_id}")
def generate_insight(product_id: str, db: Session = Depends(get_db)):

    current_time = datetime.now()

    product_row  = db.execute(text("""
        SELECT name FROM "Product" WHERE id = :pid
    """), {"pid": product_id}).fetchone()
    product_name = product_row[0] if product_row else "Produk ini"

    data = aggregate_product_metrics(product_id=product_id, db=db)

    positive = float(data.get("positive_percentage") or 0)
    negative = float(data.get("negative_percentage") or 0)
    neutral  = float(data.get("neutral_percentage")  or 0)
    growth   = float(data.get("growth_percentage")   or 0)
    keyword  = data.get("top_keyword")
    trend    = data.get("forecast_trend") or "stable"

    score      = calculate_health_score(positive, negative, growth)
    label      = get_health_label(score)
    risk_level = "high" if score < 35 else "medium" if score < 55 else "low"

    insights, recommendations, raw_sentences = generate_structured_insights(
        positive=positive,
        negative=negative,
        neutral=neutral,
        keyword=keyword,
        growth=growth,
        trend=trend,
        product_name=product_name,
    )

    executive_summary = generate_executive_summary(
        product_name=product_name,
        positive=positive,
        negative=negative,
        trend=trend,
        risk_level=risk_level,
        dominant_issue=keyword or "",
        growth=growth,
    )

    rule_summary  = " ".join(raw_sentences[:3])
    top_rec       = recommendations[0] if recommendations else ""
    prompt        = build_prompt(raw_sentences=raw_sentences, top_recommendation=top_rec)
    final_summary = safe_generate(
        prompt=prompt,
        fallback_text=rule_summary,
        rule_text=rule_summary,
    )
    llm_used = final_summary != rule_summary

    # ── Hitung confidence dari interval Prophet ───────────────────────────────
    data_points_row = db.execute(text("""
        SELECT COUNT(*) FROM "Sales" WHERE "productId" = :pid
    """), {"pid": product_id}).scalar() or 0
    data_points = int(data_points_row)

    confidence_row = db.execute(text("""
        SELECT
            AVG("predictedSales")            AS avg_pred,
            AVG("upperBound" - "lowerBound") AS avg_interval
        FROM "Prediction"
        WHERE "productId" = :pid
          AND "upperBound" IS NOT NULL
          AND "lowerBound" IS NOT NULL
    """), {"pid": product_id}).fetchone()

    if (
        confidence_row
        and confidence_row[0] is not None
        and confidence_row[1] is not None
    ):
        avg_pred     = float(confidence_row[0])
        avg_interval = float(confidence_row[1])
        rel_width    = avg_interval / avg_pred if avg_pred > 0 else 1.0
        raw_conf     = max(0.0, 1.0 - rel_width) * 100

        if data_points >= 90:
            raw_conf = min(raw_conf * 1.1, 95.0)
        elif data_points < 14:
            raw_conf *= 0.75

        confidence = round(max(5.0, min(raw_conf, 95.0)), 2)
    else:
        confidence = 0.0

    if confidence >= 70:
        confidence_label   = "Akurasi Tinggi"
        confidence_color   = "green"
        confidence_message = "Pola penjualan konsisten, prediksi interval dapat diandalkan."
    elif confidence >= 40:
        confidence_label   = "Akurasi Sedang"
        confidence_color   = "amber"
        confidence_message = (
            f"Prediksi cukup andal dengan {data_points} hari data. "
            "Tambah data hingga 90 hari untuk akurasi lebih tinggi."
        )
    else:
        confidence_label   = "Akurasi Rendah"
        confidence_color   = "red"
        if data_points < 14:
            days_needed        = 14 - data_points
            confidence_message = (
                f"Data historis hanya {data_points} hari — minimal 14 hari diperlukan. "
                f"Tambahkan {days_needed} hari data lagi untuk prediksi yang lebih baik."
            )
        else:
            confidence_message = (
                f"Pola penjualan masih fluktuatif dengan {data_points} hari data. "
                "Tambah data hingga 90 hari untuk hasil lebih akurat."
            )

    # ── Simpan ke DB — DELETE + INSERT (aman tanpa butuh unique constraint) ──
    try:
        db.execute(text("""
            DELETE FROM "Insight" WHERE "productId" = :product_id
        """), {"product_id": product_id})

        db.execute(text("""
            INSERT INTO "Insight" (
                id, "productId",
                summary, "executiveSummary",
                insights, recommendations,
                "sentimentScore", "dominantIssue", "demandTrend",
                "demandGrowthPct", "riskLevel", "healthScore",
                "llmUsed", "llmModel",
                "confidence", "confidenceLabel", "confidenceMessage", "confidenceColor",
                "createdAt", "updatedAt"
            ) VALUES (
                :id, :product_id,
                :summary, :executive_summary,
                CAST(:insights AS jsonb), CAST(:recommendations AS jsonb),
                :sentiment, :issue, :trend,
                :growth, :risk, :health_score,
                :llm_used, :model,
                :confidence, :confidence_label, :confidence_message, :confidence_color,
                :created_at, :updated_at
            )
        """), {
            "id":                 str(uuid.uuid4()),
            "product_id":         product_id,
            "summary":            final_summary,
            "executive_summary":  executive_summary,
            "insights":           json.dumps(insights),
            "recommendations":    json.dumps(recommendations),
            "sentiment":          float(positive),
            "issue":              keyword or "none",
            "trend":              trend,
            "growth":             float(growth),
            "risk":               risk_level,
            "health_score":       float(score),
            "llm_used":           llm_used,
            "model":              "qwen2.5" if llm_used else None,
            "confidence":         float(confidence),
            "confidence_label":   confidence_label,
            "confidence_message": confidence_message,
            "confidence_color":   confidence_color,
            "created_at":         current_time,
            "updated_at":         current_time,
        })
        db.commit()
        print(f"✅ Insight saved — {product_name} | confidence: {confidence}% ({confidence_label}) | data: {data_points} hari")

    except Exception as e:
        db.rollback()
        print(f"⚠ Gagal simpan insight: {e}")

    sentiment_trend = calculate_sentiment_trend(product_id, db)

    return {
        "executive_summary":  executive_summary,
        "summary":            final_summary,
        "health_score":       score,
        "health_label":       label,
        "insights":           insights,
        "recommendations":    recommendations,
        "dominant_issue":     keyword,
        "risk_level":         risk_level,
        "llm_used":           llm_used,
        "metrics":            data,
        "sentiment_trend":    sentiment_trend,
        "confidence":         confidence,
        "confidence_context": {
            "label":   confidence_label,
            "message": confidence_message,
            "color":   confidence_color,
        },
    }