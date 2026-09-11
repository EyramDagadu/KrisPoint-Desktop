import unittest

from asr_benchmark import (
    edit_distance,
    missed_phrases,
    phrase_counts,
    validate_manifest,
    words,
)


class BenchmarkScoringTests(unittest.TestCase):
    def test_word_edit_distance(self):
        self.assertEqual(edit_distance(["no", "oedema"], ["no", "edema"]), 1)

    def test_phrase_matching_uses_token_boundaries(self):
        self.assertEqual(phrase_counts(words("airline"), ["air line"]), {})
        self.assertEqual(phrase_counts(words("new line now"), ["new line"]), {"new line": 1})

    def test_repeated_medical_terms_are_scored_by_occurrence(self):
        missed = missed_phrases(
            ["oedema", "oedema"], words("There is mild oedema")
        )
        self.assertEqual(missed, {"oedema": 1})

    def test_unexpected_command_is_visible_as_false_positive(self):
        expected = phrase_counts(words("normal chest"), [])
        predicted = phrase_counts(words("normal chest new line"), ["new line"])
        self.assertNotEqual(expected, predicted)

    def test_manifest_rejects_unverified_locale(self):
        sample = {
            "audio": "clip.wav",
            "transcript": "Findings section no oedema",
            "speaker_locale": "unverified",
            "speaker_locale_verified": False,
            "specialty": "chest radiology",
            "deidentified": True,
            "medical_terms": ["oedema"],
            "commands": ["findings section"],
        }
        with self.assertRaisesRegex(ValueError, "locale"):
            validate_manifest([sample], ["findings section"])

    def test_manifest_rejects_annotation_absent_from_reference(self):
        sample = {
            "audio": "clip.wav",
            "transcript": "No oedema",
            "speaker_locale": "Ghanaian English",
            "speaker_locale_verified": True,
            "specialty": "chest radiology",
            "deidentified": True,
            "medical_terms": ["pneumothorax"],
            "commands": [],
        }
        with self.assertRaisesRegex(ValueError, "absent"):
            validate_manifest([sample], [])


if __name__ == "__main__":
    unittest.main()