import requests

OLLAMA_URL = "http://localhost:11434/api/generate"

def generate_natural_insight(prompt):

    payload = {
        "model": "phi3:mini",
        "prompt": prompt,
        "stream": False,
        "options": {
    "temperature": 0.2,
    "num_predict": 80
}
    }

    response = requests.post(
        OLLAMA_URL,
        json=payload,
        timeout=120
    )

    data = response.json()

    return data["response"].strip()


def safe_generate(prompt, fallback_text):

    try:

        result = generate_natural_insight(prompt)

        if not result:
            return fallback_text

        return result

    except Exception as e:

        print("LLM ERROR:", e)

        return fallback_text