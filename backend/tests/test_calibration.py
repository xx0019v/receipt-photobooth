from booth.artifact import black_ratio
from booth.calibration import build_test_pattern


def test_calibration_pattern_is_thermal_safe():
    pattern = build_test_pattern(384)
    assert pattern.size == (384, 1250)
    assert pattern.mode == "1"
    assert 0.05 < black_ratio(pattern) < 0.5
