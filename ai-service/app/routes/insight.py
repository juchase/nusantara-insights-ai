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

current_time = datetime.now()
router = APIRouter()

@router.get("/generate-insight/{product_id}")
def generate_insight(product_id: str, db: Session = Depends(get_db)):

    # Ambil nama produk
    product_row = db.execute(text("""
        SELECT name FROM "Product" WHERE id = :pid
    """), {"pid": product_id}).fetchone()
    product_name = product_row[0] if product_row else "Produk ini"

    data = aggregate_product_metrics(product_id=product_id, db=db)

    # ── Cast semua nilai ke float ────────────────────────────────────────────
    # aggregate_product_metrics dan query DB bisa mengembalikan Decimal dari
    # PostgreSQL — semua operasi aritmatika butuh tipe yang konsisten (float)
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

    rule_summary  = " ".join(raw_sentences[:2])
    top_rec       = recommendations[0] if recommendations else ""
    prompt        = build_prompt(raw_sentences=raw_sentences, top_recommendation=top_rec)
    final_summary = safe_generate(
        prompt=prompt,
        fallback_text=rule_summary,
        rule_text=rule_summary
    )
    llm_used = final_summary != rule_summary

        # ── HITUNG CONFIDENCE DARI TABEL PREDICTION ──────────────────────────────
    confidence_row = db.execute(text("""
        SELECT 
            AVG("predictedSales") as avg_pred,
            AVG("upperBound" - "lowerBound") as avg_interval
        FROM "Prediction"
        WHERE "productId" = :pid
          AND "upperBound" IS NOT NULL
          AND "lowerBound" IS NOT NULL
    """), {"pid": product_id}).fetchone()

    if confidence_row and confidence_row[0] is not None and confidence_row[1] is not None:
        avg_pred     = float(confidence_row[0])
        avg_interval = float(confidence_row[1])
        # Ambil rata-rata rasio lebar interval terhadap nilai prediksi asli
        rel_width    = avg_interval / avg_pred if avg_pred > 0 else 1.0
        # Formula: Sempit interval -> Confidence tinggi
        raw_confidence = max(0.0, 1.0 - rel_width) * 100
        confidence   = round(max(5.0, min(raw_confidence, 95.0)), 2)
    else:
        confidence = 0.0

    confidence_label   = "Akurasi Tinggi" if confidence >= 70 else "Akurasi Sedang" if confidence >= 40 else "Akurasi Rendah"
    confidence_color   = "green" if confidence >= 70 else "amber" if confidence >= 40 else "red"
    confidence_message = (
        "Pola penjualan konsisten, prediksi interval dapat diandalkan" if confidence >= 70 else
        "Ada pola tren, gunakan sebagai referensi perencanaan stok" if confidence >= 40 else
        "Tambah data historis lebih banyak untuk hasil lebih akurat"
    )

    # ── SIMPAN KE DB (UPDATE INSERT QUERY) ───────────────────────────────────
    try:
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
            "id":                str(uuid.uuid4()),
            "product_id":        product_id,
            "summary":           final_summary,
            "executive_summary": executive_summary,
            "insights":          json.dumps(insights),
            "recommendations":   json.dumps(recommendations),
            "sentiment":         float(positive),
            "issue":             keyword or "none",
            "trend":             trend,
            "growth":            float(growth),
            "risk":              risk_level,
            "health_score":      float(score),
            "llm_used":          llm_used,
            "model":             "qwen2.5" if llm_used else None,
            # Ambil nilai baru hasil olahan interval Prophet
            "confidence":         float(confidence),
            "confidence_label":   confidence_label,
            "confidence_message": confidence_message,
            "confidence_color":   confidence_color,
            "created_at":        current_time,
            "updated_at":        current_time,
        })
        db.commit()
        print(f"✅ Insight & Confidence ({confidence}%) saved untuk {product_name}")

        print(f"✅ Insight saved untuk {product_name}")

    except Exception as e:
        db.rollback()
        print(f"⚠ Gagal simpan insight: {e}")

    sentiment_trend = calculate_sentiment_trend(product_id, db)

    return {
        "executive_summary": executive_summary,
        "summary":           final_summary,
        "health_score":      score,
        "health_label":      label,
        "insights":          insights,
        "recommendations":   recommendations,
        "dominant_issue":    keyword,
        "risk_level":        risk_level,
        "llm_used":          llm_used,
        "metrics":           data,
        "sentiment_trend":   sentiment_trend,
    }