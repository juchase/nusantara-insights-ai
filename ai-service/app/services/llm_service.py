import requests

OLLAMA_URL = "http://localhost:11434/api/generate"


def generate_natural_insight(prompt):

    payload = {
        "model": "qwen2:0.5b",
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.1,
            "num_predict": 60,
        }
    }

    response = requests.post(
        OLLAMA_URL,
        json=payload,
        timeout=60
    )

    data = response.json()

    print(data)

    return data["response"].strip()


def safe_generate(prompt, fallback_text):

    try:

        result = generate_natural_insight(prompt)

        print("LLM RESULT:", result)

        if not result:
            return fallback_text

        return result

    except Exception:

        return fallback_text