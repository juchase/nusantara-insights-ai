def calculate_health_score(
    positive,
    negative,
    growth_percentage
):

    score = 50

    # positive sentiment
    score += positive * 0.3

    # negative penalty
    score -= negative * 0.2

    # demand growth
    score += growth_percentage * 0.5

    score = max(0, min(100, score))

    return round(score)