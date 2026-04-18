import re

def handle_negation(text: str) -> str:
    text = text.lower()

    # 🔥 POSITIVE phrases
    text = text.replace("tidak ada masalah", "tidak_ada_masalah")
    text = text.replace("tidak masalah", "tidak_masalah")

    # 🔥 NEGATIVE phrases
    text = text.replace("tidak bagus", "tidak_bagus")
    text = text.replace("tidak sesuai", "tidak_sesuai")
    text = text.replace("tidak enak", "tidak_enak")
    text = text.replace("tidak puas", "tidak_puas")

    return text


def clean_text(text: str) -> str:
    text = str(text).lower()
    text = handle_negation(text)

    # remove symbol tapi keep underscore
    text = re.sub(r'[^a-zA-Z_\s]', '', text)

    # remove extra space
    text = re.sub(r'\s+', ' ', text).strip()

    return text