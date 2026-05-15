def build_prompt(data, rules):

    prompt = f"""
Tugas Anda hanya merapikan insight bisnis.

JANGAN membuat analisis baru.
JANGAN menambahkan data baru.
JANGAN membuat pembukaan.

Gunakan informasi berikut saja.

Insight:
{chr(10).join(['- ' + i for i in rules['insights']])}

Rekomendasi:
{chr(10).join(['- ' + r for r in rules['recommendations']])}

Tulis maksimal 2 kalimat.
Gunakan Bahasa Indonesia profesional dan singkat.
"""

    return prompt