import requests
import re

LM_STUDIO_URL = "http://localhost:1234/v1/chat/completions"
MODEL_ID      = "qwen2.5-1.5b-instruct"  # dari hasil /v1/models

def generate_natural_insight(prompt: str) -> str:
    payload = {
        "model": MODEL_ID,
        "messages": [
            {
                "role": "system",
                "content": "Kamu adalah analis bisnis UMKM Indonesia. Tulis kalimat bisnis yang natural dan formal dalam Bahasa Indonesia. Jangan tambah informasi yang tidak ada."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.1,
        "max_tokens": 80,
        "stream": False
    }

    response = requests.post(LM_STUDIO_URL, json=payload, timeout=60)
    response.raise_for_status()

    text = response.json()["choices"][0]["message"]["content"].strip()
    print(f"✅ LLM raw: {text}")
    return text


def clean_output(text: str) -> str:
    if not text:
        return ""
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    sentences = [s for s in sentences if len(s) > 15]
    result = " ".join(sentences[:2])
    result = re.sub(r'[^\w\s.,!?%():-]', '', result)
    return re.sub(r'\s+', ' ', result).strip()


def validate_output(text: str, rule_text: str) -> bool:
    if not text or len(text) < 20:
        return False

    INVALID_WORDS = ["produktif", "konsumen kami", "perusahaan kami"]
    for word in INVALID_WORDS:
        if word in text.lower():
            print(f"⚠ Output mengandung kata tidak valid: '{word}'")
            return False

    # Angka dari rule engine harus tetap ada di output
    numbers_in_rule = re.findall(r'\d+', rule_text)
    if numbers_in_rule:
        if not re.findall(r'\d+', text):
            print("⚠ Output kehilangan angka dari rule engine")
            return False

    return True


def safe_generate(prompt: str, fallback_text: str, rule_text: str = "") -> str:
    try:
        raw    = generate_natural_insight(prompt)
        result = clean_output(raw)

        if not validate_output(result, rule_text):
            print("⚠ Validasi gagal, pakai rule engine output")
            return fallback_text

        return result

    except Exception as e:
        print(f"⚠ LLM fallback: {e}")
        return fallback_text