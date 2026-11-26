import unittest

from app.services.forecasting_v2.confidence import calculate_forecast_confidence
from app.services.forecasting_v2.adaptive_selection.validation import calculate_metrics


class ForecastConfidenceTests(unittest.TestCase):
    def test_confidence_is_100_minus_wape(self):
        result = calculate_forecast_confidence(24.0, 14, False, "success")
        self.assertEqual(result.score, 76.0)
        self.assertEqual(result.status, "available")

    def test_confidence_unavailable_for_runtime_fallback(self):
        result = calculate_forecast_confidence(20.0, 14, True, "success")
        self.assertIsNone(result.score)
        self.assertEqual(result.reason, "fallback_model_used")

    def test_confidence_unavailable_for_undefined_wape(self):
        result = calculate_forecast_confidence(None, 14, False, "success")
        self.assertIsNone(result.score)
        self.assertEqual(result.reason, "wape_undefined")

    def test_wape_undefined_when_actual_total_is_zero(self):
        mae, rmse, wape = calculate_metrics([0, 0], [1, 2])
        self.assertEqual(mae, 1.5)
        self.assertGreater(rmse, 0)
        self.assertIsNone(wape)


if __name__ == "__main__":
    unittest.main()
