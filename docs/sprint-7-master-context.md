# NUSANTARAINSIGHT AI — SPRINT 7 MASTER PROMPT

Saya sedang mengembangkan sistem AI Business Intelligence bernama **NusantaraInsight AI** untuk skripsi.

Project ini sudah masuk tahap FINAL POLISH (Sprint 7).

---

# 🎯 TUJUAN SISTEM

NusantaraInsight AI membantu UMKM menganalisis:

1. Sentiment pelanggan
2. Keluhan utama pelanggan
3. Prediksi permintaan produk
4. AI-generated business insight & recommendation

---

# 🧱 TECH STACK

## Frontend + Backend

- Next.js App Router
- TypeScript
- TailwindCSS
- Prisma ORM
- PostgreSQL

## AI Service

- FastAPI (Python)
- Sentiment Analysis
- Demand Forecasting
- AI Insight Generator
- Ollama / Local LLM

---

# 🤖 AI ARCHITECTURE (FINAL)

## Hybrid AI Architecture

Sistem menggunakan kombinasi:

### 1. Rule-Based AI

Digunakan untuk:

- business logic
- deterministic analytics
- insight structure
- recommendation engine

### 2. Local LLM Enhancement

Digunakan hanya untuk:

- natural language generation
- summary polishing
- human-readable business insight

LLM TIDAK digunakan untuk:

- forecasting
- sentiment calculation
- business rules

---

# 🧠 CURRENT LLM FLOW

Flow AI Insight:

Aggregation Service
↓
Rule Engine
↓
Structured Insight
↓
Few-shot Prompt Builder
↓
Local LLM (Ollama)
↓
Validation Layer
↓
Dashboard

---

# 📊 CURRENT FEATURES (DONE)

✅ CSV Upload
✅ Product Detection
✅ Sentiment Analysis
✅ Complaint Extraction
✅ Demand Forecasting
✅ Forecast Chart
✅ Multi Product Support
✅ AI Insight Generator
✅ Health Score
✅ Recommendation Engine
✅ Local LLM Integration
✅ Dashboard Analytics

---

# 🎯 IMPORTANT ARCHITECTURE NOTES

## Forecast

Forecast flow SUDAH STABIL.
JANGAN REFACTOR forecast architecture besar-besaran.

Growth calculation juga SUDAH STABIL.
JANGAN ubah flow growth dulu.

## Insight

Insight saat ini:

- realtime generated
- fetch langsung ke FastAPI
- BELUM menggunakan DB persistence
- BELUM menggunakan cache layer

Dan itu disengaja untuk menjaga simplicity.

## Database Models

Sudah ada:

- Insight
- AILog

Tetapi BELUM dipakai aktif di current flow.

JANGAN paksa implement persistence layer jika tidak diperlukan.

---

# 🎨 TARGET SPRINT 7

Sprint 7 fokus pada:

## UI/UX Polish

Bukan refactor backend besar.

Target:

- terlihat modern
- terlihat premium
- terlihat AI-powered
- siap demo sidang

---

# 🎯 PRIORITAS SPRINT 7

## 1. Dashboard UI Polish

Improve:

- spacing
- typography
- card hierarchy
- visual consistency
- responsive layout

## 2. AI Feel

Tambahkan:

- skeleton loading
- AI generation animation
- insight highlighting
- better badges
- health score visualization

## 3. Chart Polish

Improve:

- chart styling
- tooltip
- legend
- empty state
- responsive behavior

## 4. Product Selector UX

Improve:

- dropdown appearance
- loading state
- default selected product
- empty product state

## 5. Insight Panel

Improve:

- insight priority colors
- icons
- recommendation cards
- AI summary section
- better readability

## 6. Professional Presentation

Tujuan akhir:
Dashboard harus terlihat seperti:

- SaaS analytics platform
- AI business intelligence system
- modern startup dashboard

---

# ⚠️ IMPORTANT RULES

## DO NOT:

- refactor besar architecture
- ubah forecasting flow
- ubah growth logic
- ubah database structure besar
- ubah AI pipeline besar

## FOCUS ONLY:

- UI polish
- UX improvement
- visual enhancement
- component cleanup
- responsive layout
- loading experience
- presentation quality

---

# 🎯 DESIGN STYLE TARGET

Gunakan style:

- clean modern SaaS
- minimal but premium
- soft shadows
- rounded cards
- professional AI dashboard
- subtle gradients
- elegant spacing

Inspirasi:

- Vercel
- Notion
- Perplexity
- Stripe Dashboard
- Modern AI SaaS

---

# 🎯 CODING STYLE

- Clean component architecture
- Maintain existing flow
- Avoid over-engineering
- Reuse existing state
- Avoid unnecessary backend refactor
- Prioritize stable UI

---

# 🎯 FINAL GOAL

Saat sidang, dashboard harus terasa seperti:

“AI Business Intelligence Platform untuk UMKM Indonesia”

dan terlihat:

- realtime
- intelligent
- modern
- professional
- production-ready

Bantu saya implement Sprint 7 step-by-step tanpa merusak architecture yang sudah stabil.
