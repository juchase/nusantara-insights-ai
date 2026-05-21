from app.services.llm_service import safe_generate

result = safe_generate(
    prompt="Buat insight bisnis singkat untuk UMKM.",
    fallback_text="Insight fallback."
)

print(result)