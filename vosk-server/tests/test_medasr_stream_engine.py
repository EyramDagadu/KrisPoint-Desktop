import sys
import threading
import unittest
from unittest.mock import patch
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from medasr_stream_engine import MedASRStreamEngine


class MedASRVadTests(unittest.TestCase):
    def make_engine(self):
        engine = MedASRStreamEngine(sample_rate=100)
        engine.vad_silence_seconds = 0.3
        engine.vad_min_speech_seconds = 0.2
        engine.vad_pre_roll_seconds = 0.2
        engine.vad_max_utterance_seconds = 2.0
        transcribed = []

        def capture():
            transcribed.append(np.concatenate(engine.audio_buffer).copy())

        engine._transcribe_buffer = capture
        return engine, transcribed

    @staticmethod
    def speech(samples, level=0.1):
        return np.full(samples, level, dtype=np.float32)

    def test_silence_only_never_transcribes(self):
        engine, transcribed = self.make_engine()
        for _ in range(5):
            engine._process_audio_chunk(np.zeros(10, dtype=np.float32))
        engine._flush_for_stop()
        self.assertEqual(transcribed, [])

    def test_natural_pause_flushes_utterance(self):
        engine, transcribed = self.make_engine()
        engine._process_audio_chunk(self.speech(10))
        engine._process_audio_chunk(self.speech(10))
        engine._process_audio_chunk(np.zeros(10, dtype=np.float32))
        engine._process_audio_chunk(np.zeros(10, dtype=np.float32))
        engine._process_audio_chunk(np.zeros(10, dtype=np.float32))
        self.assertEqual([len(audio) for audio in transcribed], [20])

    def test_internal_quiet_frames_are_retained_but_endpoint_silence_is_trimmed(self):
        engine, transcribed = self.make_engine()
        engine._process_audio_chunk(self.speech(10))
        engine._process_audio_chunk(self.speech(10))
        engine._process_audio_chunk(np.full(10, 0.01, dtype=np.float32))
        engine._process_audio_chunk(self.speech(10))
        engine._process_audio_chunk(np.zeros(30, dtype=np.float32))
        self.assertEqual([len(audio) for audio in transcribed], [40])
        np.testing.assert_allclose(transcribed[0][20:30], 0.01)

    def test_stop_flushes_utterance_without_waiting_for_pause(self):
        engine, transcribed = self.make_engine()
        engine._process_audio_chunk(self.speech(10, level=0.05))
        engine._process_audio_chunk(self.speech(10, level=0.1))
        engine._flush_for_stop()
        self.assertEqual([len(audio) for audio in transcribed], [20])

    def test_onset_keeps_word_beginning_before_minimum_duration(self):
        engine, transcribed = self.make_engine()
        engine._process_audio_chunk(self.speech(10, level=0.03))
        engine._process_audio_chunk(self.speech(10, level=0.1))
        engine._flush_for_stop()
        self.assertEqual([len(audio) for audio in transcribed], [20])
        np.testing.assert_allclose(transcribed[0][:10], 0.03)

    def test_maximum_utterance_length_forces_flush(self):
        engine, transcribed = self.make_engine()
        engine.vad_max_utterance_seconds = 0.3
        for _ in range(5):
            engine._process_audio_chunk(self.speech(10, level=0.01))
        for level in (0.05, 0.1, 0.08):
            engine._process_audio_chunk(self.speech(10, level=level))
        self.assertEqual([len(audio) for audio in transcribed], [30])

    def test_constant_room_noise_is_calibrated_and_louder_speech_starts(self):
        engine, transcribed = self.make_engine()
        room_noise = self.speech(10, level=0.03)
        for _ in range(5):
            engine._process_audio_chunk(room_noise)
        self.assertFalse(engine._utterance_active)
        engine._process_audio_chunk(self.speech(10, level=0.15))
        engine._flush_for_stop()
        self.assertEqual([len(audio) for audio in transcribed], [20])
        self.assertTrue(engine._noise_floor >= 0.02)

    def test_loud_stationary_noise_is_not_startup_speech(self):
        engine, transcribed = self.make_engine()
        room_noise = (np.sin(np.linspace(0, 2 * np.pi, 10,
                                         endpoint=False)) * 0.08).astype(np.float32)
        for _ in range(5):
            engine._process_audio_chunk(room_noise)
        self.assertTrue(engine._noise_calibrated)
        self.assertFalse(engine._utterance_active)
        engine._flush_for_stop()
        self.assertEqual(transcribed, [])

    def test_identical_loud_calibration_chunks_are_not_speech_on_stop(self):
        engine, transcribed = self.make_engine()
        loud_noise = self.speech(10, level=0.08)
        engine._process_audio_chunk(loud_noise)
        engine._process_audio_chunk(loud_noise)
        engine._flush_for_stop()
        self.assertEqual(transcribed, [])

    def test_identical_large_startup_packets_are_not_speech(self):
        engine = MedASRStreamEngine(sample_rate=16000)
        transcribed = []
        engine._transcribe_buffer = lambda: transcribed.append(
            np.concatenate(engine.audio_buffer).copy())
        loud_noise = self.speech(8192, level=0.08)
        engine._process_audio_chunk(loud_noise)
        engine._process_audio_chunk(loud_noise)
        engine._flush_for_stop()
        self.assertEqual(transcribed, [])

    def test_variable_quiet_speech_startup_is_retained(self):
        engine, transcribed = self.make_engine()
        # Energy changes, rather than an absolute RMS value, identify this as
        # speech during calibration.
        for level in (0.015, 0.03, 0.02, 0.045, 0.025, 0.06):
            engine._process_audio_chunk(self.speech(10, level=level))
        engine._flush_for_stop()
        self.assertEqual([len(audio) for audio in transcribed], [60])
        self.assertLess(float(np.max(np.abs(transcribed[0][:10]))), 0.02)

    def test_noise_then_speech_does_not_transcribe_room_tone(self):
        engine, transcribed = self.make_engine()
        for _ in range(5):
            engine._process_audio_chunk(self.speech(10, level=0.06))
        for level in (0.13, 0.09, 0.12):
            engine._process_audio_chunk(self.speech(10, level=level))
        engine._flush_for_stop()
        self.assertEqual([len(audio) for audio in transcribed], [30])
        self.assertGreater(float(np.min(transcribed[0])), 0.08)

    def test_noise_calibration_survives_two_utterances(self):
        engine, transcribed = self.make_engine()
        for _ in range(5):
            engine._process_audio_chunk(self.speech(10, level=0.02))
        for level in (0.12, 0.10, 0.11):
            engine._process_audio_chunk(self.speech(10, level=level))
        for _ in range(3):
            engine._process_audio_chunk(np.zeros(10, dtype=np.float32))
        self.assertEqual(len(transcribed), 1)
        self.assertTrue(engine._noise_calibrated)
        for level in (0.06, 0.05, 0.07):
            engine._process_audio_chunk(self.speech(10, level=level))
        engine._flush_for_stop()
        self.assertEqual(len(transcribed), 2)
        self.assertTrue(engine._noise_calibrated)

    def test_second_utterance_keeps_first_onset_frame_exactly_once(self):
        engine, transcribed = self.make_engine()
        for _ in range(5):
            engine._process_audio_chunk(self.speech(10, level=0.02))
        first = np.concatenate([
            self.speech(10, level=0.12),
            self.speech(10, level=0.10),
            self.speech(10, level=0.11),
        ])
        for chunk in np.split(first, 3):
            engine._process_audio_chunk(chunk)
        for _ in range(3):
            engine._process_audio_chunk(np.zeros(10, dtype=np.float32))
        second = np.concatenate([
            self.speech(10, level=0.06),
            self.speech(10, level=0.05),
            self.speech(10, level=0.07),
        ])
        for chunk in np.split(second, 3):
            engine._process_audio_chunk(chunk)
        for _ in range(3):
            engine._process_audio_chunk(np.zeros(10, dtype=np.float32))
        self.assertEqual(len(transcribed), 2)
        np.testing.assert_array_equal(transcribed[1], second)

    def test_start_is_rejected_while_stop_finalizes(self):
        engine = MedASRStreamEngine(sample_rate=100)
        engine.start_processing()
        entered = threading.Event()
        release = threading.Event()

        def blocked_flush():
            entered.set()
            self.assertTrue(release.wait(2))

        engine._flush_for_stop = blocked_flush
        stopping = threading.Thread(target=engine.stop_processing)
        stopping.start()
        self.assertTrue(entered.wait(2))
        with self.assertRaisesRegex(RuntimeError, "previous recording is stopping"):
            engine.start_processing()
        release.set()
        stopping.join(2)
        self.assertFalse(stopping.is_alive())
        engine.start_processing()
        self.assertTrue(engine.is_recording)
        engine.stop_processing()

    def test_queue_overload_drops_oldest_audio_and_reports_samples(self):
        engine = MedASRStreamEngine(sample_rate=100)
        engine._queue_max_samples = 20
        engine.is_recording = True
        engine.feed_audio(self.speech(10, level=0.01))
        engine.feed_audio(self.speech(10, level=0.02))
        engine.feed_audio(self.speech(10, level=0.03))
        metrics = engine.get_metrics()
        self.assertEqual(metrics["vad_queue_samples"], 20)
        self.assertEqual(metrics["vad_dropped_samples"], 10)
        self.assertGreaterEqual(metrics["vad_dropped_chunks"], 1)
        engine.is_recording = False

    def test_realistic_browser_chunk_sizes_are_accepted(self):
        engine = MedASRStreamEngine(sample_rate=16000)
        transcribed = []
        engine._transcribe_buffer = lambda: transcribed.append(
            np.concatenate(engine.audio_buffer).copy())
        for level in (0.04, 0.1, 0.12, 0.08):
            engine._process_audio_chunk(self.speech(2048, level=level))
        engine._flush_for_stop()
        self.assertEqual([len(audio) for audio in transcribed], [8192])
        self.assertLessEqual(engine.vad_max_utterance_seconds, 60.0)

    def test_out_of_range_max_utterance_setting_uses_safe_default(self):
        with patch.dict("os.environ", {"MEDASR_VAD_MAX_UTTERANCE_SECONDS": "200"}):
            engine = MedASRStreamEngine(sample_rate=100)
        self.assertEqual(engine.vad_max_utterance_seconds, 30.0)


if __name__ == "__main__":
    unittest.main()