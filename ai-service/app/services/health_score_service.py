def calculate_health_score(positive, negative, growth_percentage):
    score = 50
    score += positive  * 0.3
    score -= negative  * 0.2
    score += growth_percentage * 0.5
    return max(0, min(100, round(score)))

def get_health_label(score: int) -> str:
    if score >= 75:
        return "Sangat Baik"
    elif score >= 55:
        return "Baik"
    elif score >= 35:
        return "Perlu Perhatian"
    else:
        return "Kritis"