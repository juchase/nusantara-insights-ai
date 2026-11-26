from dataclasses import asdict, dataclass
MIN_CONFIDENCE_PREDICTIONS = 2

@dataclass(frozen=True)
class ConfidenceResult:
    score: float | None
    status: str
    method: str
    reason: str | None
    label: str
    message: str
    color: str
    def to_dict(self): return asdict(self)

def calculate_forecast_confidence(validation_wape, n_predictions, fallback_used, evaluation_status):
    if fallback_used:
        return ConfidenceResult(None, "unavailable", "100 - validation_wape", "fallback_model_used", "Belum tersedia", "Model yang digunakan merupakan fallback; metrik model terpilih tidak mewakili hasil fallback.", "gray")
    if evaluation_status != "success":
        return ConfidenceResult(None, "unavailable", "100 - validation_wape", evaluation_status, "Belum tersedia", "Evaluasi model belum berhasil atau data validasi belum mencukupi.", "gray")
    if n_predictions < MIN_CONFIDENCE_PREDICTIONS:
        return ConfidenceResult(None, "unavailable", "100 - validation_wape", "insufficient_validation_predictions", "Belum tersedia", "Jumlah prediksi validasi belum mencukupi.", "gray")
    if validation_wape is None:
        return ConfidenceResult(None, "unavailable", "100 - validation_wape", "wape_undefined", "Belum tersedia", "WAPE tidak dapat dihitung karena total aktual pada data validasi bernilai nol.", "gray")
    if validation_wape < 0:
        return ConfidenceResult(None, "unavailable", "100 - validation_wape", "invalid_wape", "Belum tersedia", "Nilai WAPE tidak valid.", "gray")
    score = round(max(0.0, 100.0 - float(validation_wape)), 2)
    if score >= 80: label, message, color = "Reliabilitas tinggi", "Kesalahan relatif pada data validasi tergolong rendah.", "green"
    elif score >= 60: label, message, color = "Reliabilitas sedang", "Kesalahan relatif pada data validasi masih perlu diperhatikan.", "yellow"
    else: label, message, color = "Reliabilitas rendah", "Kesalahan relatif pada data validasi cukup tinggi.", "red"
    return ConfidenceResult(score, "available", "100 - validation_wape", None, label, message, color)
