import requests
import re

LM_STUDIO_URL = "http://localhost:1234/v1/chat/completions"
MODEL_ID      = "qwen2.5-1.5b-instruct"


def generate_natural_insight(prompt: str) -> str:
    payload = {
        "model": MODEL_ID,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Kamu adalah analis bisnis UMKM Indonesia. "
                    "Tulis narasi bisnis yang natural, formal, dan lengkap dalam Bahasa Indonesia. "
                    "Selalu selesaikan kalimat hingga tuntas. "
                    "Jangan tambahkan informasi yang tidak ada dalam input."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.1,
        "max_tokens": 180,   # dinaikkan dari 80 → 180 agar narasi tidak terpotong
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

    # Hapus karakter tidak perlu tapi pertahankan tanda baca penting
    text = re.sub(r'[^\w\s.,!?%():-]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()

    # Ambil maksimal 3 kalimat (bukan 2) agar narasi lebih lengkap
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    sentences = [s.strip() for s in sentences if len(s.strip()) > 15]

    # Pastikan kalimat terakhir tidak terpotong (harus diakhiri tanda baca)
    complete = []
    for s in sentences[:3]:
        if s and s[-1] in ".!?":
            complete.append(s)
        else:
            # Kalimat tidak lengkap — tambahkan titik agar tidak menggantung
            complete.append(s + ".")

    return " ".join(complete)


def validate_output(text: str, rule_text: str) -> bool:
    if not text or len(text) < 30:
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