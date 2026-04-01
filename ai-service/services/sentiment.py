positive_words = ["bagus", "enak", "mantap", "murah", "cepat"]
negative_words = ["buruk", "jelek", "lama", "rusak", "mahal"]

def analyze_sentiment(text: str):
    text = text.lower()

    score = 0

    for word in positive_words:
        if word in text:
            score += 1

    for word in negative_words:
        if word in text:
            score -= 1

    if score > 0:
        return "positive"
    elif score < 0:
        return "negative"
    else:
        return "neutral"