import re

def clean_text(text: str) -> str:
    text = str(text).lower()

    # remove extra space
    text = re.sub(r'\s+', ' ', text).strip()

    return text