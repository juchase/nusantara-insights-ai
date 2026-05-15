from app.services.prompt_builder import build_prompt

data = {
    "positive_sentiment": 72,
    "negative_sentiment": 18,
    "growth_percentage": 15,
    "top_keyword": "pengiriman"
}

rules = {
    "insights": [
        "Permintaan meningkat sebesar 15%"
    ],
    "recommendations": [
        "Optimalkan logistik"
    ]
}

prompt = build_prompt(data, rules)

print(prompt)