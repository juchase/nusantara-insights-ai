def calculate_health_score(positive, negative, growth_percentage):
    # Cast ke float untuk menghindari TypeError saat nilai berasal dari
    # Decimal (PostgreSQL) atau tipe numerik lain dari ORM
    p = float(positive or 0)
    n = float(negative or 0)
    g = float(growth_percentage or 0)

    score = 50
    score += p * 0.3
    score -= n * 0.2
    score += g * 0.5

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