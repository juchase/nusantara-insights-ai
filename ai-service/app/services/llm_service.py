import requests
import re

LM_STUDIO_URL = "http://localhost:1234/v1/chat/completions"
MODEL_ID       = "qwen2.5-1.5b-instruct"

MAX_PROMPT_CHARS = 4000


def generate_natural_insight(prompt: str) -> str:
    if len(prompt) > MAX_PROMPT_CHARS:
        prompt = prompt[:MAX_PROMPT_CHARS].rsplit(" ", 1)[0] + "..."
        print(f"⚠ Prompt dipotong ke {MAX_PROMPT_CHARS} karakter")

    payload = {
        "model": MODEL_ID,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Kamu adalah analis bisnis UMKM Indonesia. "
                    "Tulis narasi bisnis yang natural, formal, dan mengalir dalam Bahasa Indonesia. "
                    "WAJIB sebutkan nama produk yang disebutkan dalam input. "
                    "Selalu selesaikan kalimat hingga tuntas. "
                    "Gunakan variasi kalimat, jangan terlalu kaku. "
                    "Maksimal 3 kalimat. "
                    "Jangan tambahkan informasi yang tidak ada dalam input."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.1,
        "max_tokens":  500,   # ← dinaikkan agar narasi bisa lebih panjang
        "stream":      False,
    }

    print(f"📤 SENDING PAYLOAD TO LLM:\n{payload}\n")

    response = requests.post(LM_STUDIO_URL, json=payload, timeout=60)
    response.raise_for_status()

    text = response.json()["choices"][0]["message"]["content"].strip()
    print(f"✅ LLM raw: {text}")
    return text


def clean_output(text: str) -> str:
    if not text:
        return ""

    text = re.sub(r'[^\w\s.,!?%():-]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()

    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    sentences = [s.strip() for s in sentences if len(s.strip()) > 15]

    complete = []
    for s in sentences[:3]:
        if s and s[-1] in ".!?":
            complete.append(s)
        else:
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