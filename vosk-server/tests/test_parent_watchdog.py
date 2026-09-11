import os
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from parent_watchdog import parent_is_alive


class ParentWatchdogTests(unittest.TestCase):
    def test_current_process_probe_is_non_destructive(self):
        self.assertTrue(parent_is_alive(os.getpid()))

    def test_missing_process_is_not_alive(self):
        self.assertFalse(parent_is_alive(2_147_483_647))


if __name__ == "__main__":
    unittest.main()