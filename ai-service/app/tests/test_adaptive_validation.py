import unittest
import numpy as np
from app.services.forecasting_v2.adaptive_selection.validation import evaluate_candidates


class AdaptiveValidationTests(unittest.TestCase):
    def test_daily_history_below_minimum_is_rejected_without_selection(self):
        best, results, reason = evaluate_candidates(np.ones(34), "D")
        self.assertIsNone(best)
        self.assertEqual(results, [])
        self.assertTrue(reason.startswith("insufficient_history"))

    def test_weekly_history_below_minimum_is_rejected_without_selection(self):
        best, results, reason = evaluate_candidates(np.ones(15), "W")
        self.assertIsNone(best)
        self.assertEqual(results, [])
        self.assertTrue(reason.startswith("insufficient_history"))


if __name__ == "__main__":
    unittest.main()
