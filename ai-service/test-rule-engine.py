from app.services.rule_engine import generate_rules

data = {
    "positive_sentiment": 72,
    "negative_sentiment": 18,
    "growth_percentage": 15,
    "top_keyword": "pengiriman"
}

result = generate_rules(data)

print(result)