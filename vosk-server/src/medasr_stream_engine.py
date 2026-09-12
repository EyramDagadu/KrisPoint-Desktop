"""Streaming adapter for Google's gated MedASR medical speech model."""
import os
import re
import sys
import threading
import time
import math
from collections import deque
from pathlib import Path

import numpy as np


class MedASRStreamEngine:
    def __init__(self, model_path=None, model_id="google/medasr", medical_vocab=None,
                 voice_commands=None, sample_rate=16000):
        bundled_model = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent)) / "model"
        configured_model = os.getenv("MEDASR_MODEL_ID")
        if configured_model:
            self.model_id = configured_model
        elif model_path:
            self.model_id = model_path
        elif bundled_model.is_dir():
            self.model_id = str(bundled_model)
        else:
            self.model_id = model_id
        self.local_files_only = Path(self.model_id).is_dir()
        self.model_revision = os.getenv("MEDASR_MODEL_REVISION")
        self.medical_vocab = medical_vocab or []
        self.voice_commands = voice_commands or []
        self.sample_rate = sample_rate
        self.device = os.getenv("MEDASR_DEVICE", "cpu")
        self.compute_type = "float32"
        self.model = None
        self.processor = None
        self.is_recording = False
        # The queue is bounded by audio duration rather than packet count.  A
        # deque lets feed_audio discard the oldest packets without blocking the
        # websocket thread when inference falls behind.
        self.vad_queue_seconds = self._env_float(
            "MEDASR_VAD_QUEUE_SECONDS", 5.0, 0.5, 60.0)
        self._queue_max_samples = max(1, int(self.sample_rate * self.vad_queue_seconds))
        self.audio_queue = deque()
        self._queue_condition = threading.Condition()
        self._queued_samples = 0
        self._dropped_queue_chunks = 0
        self._dropped_queue_samples = 0
        self.audio_buffer = []
        self._pre_roll_buffer = deque()
        self._pre_roll_samples = 0
        self._pending_speech_samples = 0
        self._pending_speech_chunks = []
        self._utterance_samples = 0
        self._silence_samples = 0
        self._utterance_active = False
        self._noise_floor = None
        self._noise_calibration_samples = 0
        self._noise_calibration_rms = []
        self._noise_calibration_chunks = []
        self._noise_calibrated = False
        self._startup_speech_seen = False
        self._calibration_replay_chunks = []
        self._calibration_replay_trailing_samples = 0
        self._calibration_single_frame = False
        self._calibration_startup_chunks = []
        self._recent_rms = deque(maxlen=8)
        self._speech_candidate_active = False

        # MedASR does not have a streaming decoder.  These inexpensive VAD
        # settings provide endpointing without adding another model or
        # dependency.  Values are deliberately bounded so a bad .env value
        # cannot make the processing thread unusable.
        self.vad_silence_seconds = self._env_float(
            "MEDASR_VAD_SILENCE_SECONDS", 1.5, 0.1, 10.0)
        self.vad_max_utterance_seconds = self._env_float(
            "MEDASR_VAD_MAX_UTTERANCE_SECONDS", 30.0, 1.0, 60.0)
        self.vad_pre_roll_seconds = self._env_float(
            "MEDASR_VAD_PRE_ROLL_SECONDS", 0.25, 0.0, 2.0)
        self.vad_min_speech_seconds = self._env_float(
            "MEDASR_VAD_MIN_SPEECH_SECONDS", 0.15, 0.02, 3.0)
        self.vad_min_rms = self._env_float(
            "MEDASR_VAD_MIN_RMS", 0.005, 0.00001, 0.5)
        self.vad_speech_margin_db = self._env_float(
            "MEDASR_VAD_SPEECH_MARGIN_DB", 10.0, 1.0, 40.0)
        self.vad_noise_adaptation = self._env_float(
            "MEDASR_VAD_NOISE_ADAPTATION", 0.05, 0.001, 1.0)
        self.vad_noise_calibration_seconds = self._env_float(
            "MEDASR_VAD_NOISE_CALIBRATION_SECONDS", 0.5, 0.05, 3.0)
        self.vad_startup_speech_rms = self._env_float(
            "MEDASR_VAD_STARTUP_SPEECH_RMS", 0.04, 0.01, 0.5)
        self.vad_release_margin = self._env_float(
            "MEDASR_VAD_RELEASE_MARGIN", 1.5, 1.05, 5.0)

        self.callbacks = {"partial": [], "final": [], "command": []}
        self.latency_ms = 0
        self.processing_thread = None
        self._lifecycle_lock = threading.RLock()
        self._stopping = False

    @staticmethod
    def _env_float(name, default, minimum, maximum):
        """Read a finite, bounded float from the environment."""
        try:
            value = float(os.getenv(name, str(default)))
        except (TypeError, ValueError):
            return default
        if not math.isfinite(value) or value < minimum or value > maximum:
            return default
        return value

    def load_model(self):
        from transformers import AutoModelForCTC, AutoProcessor
        import torch
        if self.device == "cuda" and not torch.cuda.is_available():
            self.device = "cpu"
        if self.device == "cpu":
            torch.set_num_threads(max(1, int(os.getenv("MEDASR_CPU_THREADS", "4"))))
        kwargs = {"local_files_only": self.local_files_only}
        if self.model_revision and not self.local_files_only:
            kwargs["revision"] = self.model_revision
        try:
            self.processor = AutoProcessor.from_pretrained(self.model_id, **kwargs)
            self.model = AutoModelForCTC.from_pretrained(self.model_id, **kwargs)
            self.model.to(self.device)
            self.model.eval()
        except OSError as exc:
            if "gated repo" in str(exc).lower() or "401" in str(exc):
                raise RuntimeError(
                    "MedASR is gated. Accept https://huggingface.co/google/medasr "
                    "and set a read-only HF_TOKEN before starting the server."
                ) from exc
            raise

    def on_partial(self, callback): self.callbacks["partial"].append(callback)
    def on_final(self, callback): self.callbacks["final"].append(callback)
    def on_command(self, callback): self.callbacks["command"].append(callback)

    def start_processing(self):
        with self._lifecycle_lock:
            if self.is_recording:
                return
            if self._stopping or self.processing_thread is not None:
                raise RuntimeError(
                    "Cannot start recording while the previous recording is stopping")
            # A queue can contain packets received just as the previous recording
            # stopped.  A fresh queue is safer than allowing those packets into a
            # new utterance.
            with self._queue_condition:
                self.audio_queue = deque()
                self._queued_samples = 0
            self.audio_buffer = []
            # A start is the boundary of a genuinely new recording.  Utterance
            # endpointing (including an ordinary flush) deliberately does not
            # throw away a valid room-tone calibration.
            self._reset_vad_state(reset_noise_floor=True)
            self.is_recording = True
            worker = threading.Thread(target=self._process_audio, daemon=True)
            # Publish the worker before starting it.  This closes the small
            # start/stop race in which Stop could otherwise miss the thread.
            self.processing_thread = worker
            try:
                worker.start()
            except Exception:
                self.processing_thread = None
                self.is_recording = False
                raise

    def stop_processing(self):
        # Keep this local for the entire join.  In particular, the websocket
        # layer may time out its to_thread wrapper while this finalizer is still
        # draining audio; a new Start must not replace this worker's state.
        with self._lifecycle_lock:
            worker = self.processing_thread
            if worker is None:
                self.is_recording = False
                self.audio_buffer = []
                self._reset_vad_state(reset_noise_floor=False)
                return
            self._stopping = True
            self.is_recording = False
            with self._queue_condition:
                self._queue_condition.notify_all()

        worker.join()

        # Only the Stop invocation which owns this worker may finalize it.
        # (Normally Start cannot run until this block clears the reference; the
        # identity check also protects callers that manipulate lifecycle state
        # from another thread.)
        with self._lifecycle_lock:
            if self.processing_thread is worker:
                self.processing_thread = None
                self.audio_buffer = []
                self._reset_vad_state(reset_noise_floor=False)
                self._stopping = False

    def feed_audio(self, audio_data):
        # Do not retain packets arriving after Stop.  The processing thread
        # still drains packets queued before Stop so the final utterance is
        # not lost.  On overload, discard the oldest queued audio so the
        # newest speech has the best chance of being transcribed.
        if not self.is_recording:
            return
        if isinstance(audio_data, bytes):
            chunk = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768
        else:
            chunk = np.asarray(audio_data, dtype=np.float32)
        if not len(chunk):
            return
        chunk = chunk.copy()
        with self._queue_condition:
            if not self.is_recording:
                return
            if len(chunk) > self._queue_max_samples:
                discarded = len(chunk) - self._queue_max_samples
                self._dropped_queue_chunks += 1
                self._dropped_queue_samples += discarded
                chunk = chunk[-self._queue_max_samples:]
            while (self._queued_samples + len(chunk) > self._queue_max_samples
                   and self.audio_queue):
                discarded_chunk = self.audio_queue.popleft()
                self._queued_samples -= len(discarded_chunk)
                self._dropped_queue_chunks += 1
                self._dropped_queue_samples += len(discarded_chunk)
            self.audio_queue.append(chunk)
            self._queued_samples += len(chunk)
            self._queue_condition.notify()

    def _process_audio(self):
        while True:
            with self._queue_condition:
                while not self.audio_queue and self.is_recording:
                    self._queue_condition.wait(timeout=.05)
                if not self.audio_queue and not self.is_recording:
                    break
                chunk = self.audio_queue.popleft()
                self._queued_samples -= len(chunk)
            self._process_audio_chunk(chunk)
        self._flush_for_stop()

    def _reset_vad_state(self, reset_noise_floor=False):
        """Reset endpointing state without affecting callbacks or the model."""
        self.audio_buffer = []
        self._pre_roll_buffer.clear()
        self._pre_roll_samples = 0
        self._pending_speech_samples = 0
        self._pending_speech_chunks = []
        self._utterance_samples = 0
        self._silence_samples = 0
        self._utterance_active = False
        if reset_noise_floor:
            self._noise_floor = None
            self._noise_calibration_samples = 0
            self._noise_calibration_rms = []
            self._noise_calibration_chunks = []
            self._noise_calibrated = False
            self._startup_speech_seen = False
        self._calibration_replay_chunks = []
        self._calibration_replay_trailing_samples = 0
        self._calibration_single_frame = False
        self._calibration_startup_chunks = []
        self._recent_rms.clear()
        # An endpoint is not a new recording.  Keep a quiet calibrated
        # reference so a low-level onset in the next utterance can be
        # recognized on its first frame instead of waiting for a fresh
        # temporal history.  A true Start resets this baseline below.
        if (not reset_noise_floor and self._noise_calibrated and
                self._noise_floor is not None):
            self._recent_rms.extend([self._noise_floor, self._noise_floor])
        self._speech_candidate_active = False
        if reset_noise_floor:
            self._recent_rms.clear()

    def _append_pre_roll(self, audio):
        """Keep a bounded copy of audio immediately before speech onset."""
        limit = int(self.sample_rate * self.vad_pre_roll_seconds)
        if limit <= 0:
            return
        audio = np.asarray(audio, dtype=np.float32)
        self._pre_roll_buffer.append(audio.copy())
        self._pre_roll_samples += len(audio)
        while self._pre_roll_samples > limit and self._pre_roll_buffer:
            excess = self._pre_roll_samples - limit
            first = self._pre_roll_buffer[0]
            if len(first) <= excess:
                self._pre_roll_buffer.popleft()
                self._pre_roll_samples -= len(first)
            else:
                self._pre_roll_buffer[0] = first[excess:]
                self._pre_roll_samples -= excess

    def _rms_is_speech(self, audio):
        """Classify a chunk with startup calibration and hysteresis.

        Calibration is based on temporal variation, not an absolute level.
        This allows stationary fan/HVAC noise to be calibrated even when its
        RMS is above the normal speech minimum.
        """
        if not len(audio):
            return False
        rms = float(np.sqrt(np.mean(np.square(audio, dtype=np.float32))))
        if self._noise_floor is None:
            self._noise_floor = self.vad_min_rms
        calibration_limit = max(
            1, int(self.sample_rate * self.vad_noise_calibration_seconds))
        if not self._noise_calibrated:
            self._noise_calibration_rms.append(rms)
            self._noise_calibration_chunks.append(
                np.asarray(audio, dtype=np.float32).copy())
            self._noise_calibration_samples += len(audio)
            self._recent_rms.append(rms)
            if self._noise_calibration_samples < calibration_limit:
                return False
            values = np.asarray(self._noise_calibration_rms, dtype=np.float32)
            low = float(np.percentile(values, 25))
            high = float(np.percentile(values, 90))
            typical = max(float(np.median(values)), self.vad_min_rms)
            relative_span = (high - low) / typical
            high_frames = int(np.count_nonzero(
                values >= max(low * 1.2, self.vad_min_rms * 1.5)))
            # A single transient cannot open the gate.  Speech has a temporal
            # run of changing energy, while stationary noise has a tight RMS
            # distribution even when its absolute RMS is large.
            startup_speech = relative_span >= 0.25 and high_frames >= 2
            self._startup_speech_seen = startup_speech
            self._calibration_single_frame = len(values) == 1
            self._calibration_startup_chunks = list(
                self._noise_calibration_chunks)
            self._noise_floor = max(self.vad_min_rms, low)
            self._noise_calibrated = True
            if startup_speech:
                # Replay the complete bounded calibration window so the first
                # syllable is not clipped while calibration decides.
                self._calibration_replay_chunks = list(
                    self._noise_calibration_chunks)
                candidate_limit = max(low * 1.2, self.vad_min_rms * 1.5)
                candidate_indices = np.flatnonzero(values >= candidate_limit)
                if len(candidate_indices):
                    last_candidate = int(candidate_indices[-1])
                    self._calibration_replay_trailing_samples = sum(
                        len(part) for part in
                        self._noise_calibration_chunks[last_candidate + 1:])
            self._noise_calibration_rms = []
            self._noise_calibration_chunks = []
            self._noise_calibration_samples = 0
            if not startup_speech:
                return False
        self._recent_rms.append(rms)
        margin = 10.0 ** (self.vad_speech_margin_db / 20.0)
        # Once active, use a lower release threshold so normal speech
        # dynamics do not create false endpoints.  Onset remains conservative
        # to keep steady room noise out of utterances.
        release_threshold = max(
            self.vad_min_rms, self._noise_floor * self.vad_release_margin)
        onset_threshold = max(self.vad_min_rms, self._noise_floor * margin)
        threshold = release_threshold if (
            self._utterance_active or self._speech_candidate_active or
            self._pending_speech_samples) else onset_threshold
        is_speech = rms >= threshold
        if not is_speech and not self._utterance_active and not (
                self._speech_candidate_active or self._pending_speech_samples):
            # Relative onset catches quieter speech following room tone without
            # allowing a stationary loud source through an absolute cutoff.
            previous = list(self._recent_rms)[:-1]
            if len(previous) >= 2:
                previous_median = max(float(np.median(previous)), self.vad_min_rms)
                recent_values = np.asarray(self._recent_rms, dtype=np.float32)
                recent_span = (float(np.max(recent_values)) -
                               float(np.min(recent_values))) / previous_median
                is_speech = (
                    rms > release_threshold and
                    (rms >= previous_median * 1.2 or recent_span >= 0.25))

        if is_speech and not self._utterance_active:
            self._speech_candidate_active = True

        # Only low-energy frames update the floor.  Speech therefore cannot
        # slowly raise the threshold and disappear during a long dictation.
        if (not is_speech and not self._utterance_active and
                not self._speech_candidate_active and
                not self._pending_speech_samples):
            self._noise_floor += self.vad_noise_adaptation * (
                rms - self._noise_floor)
            self._noise_floor = max(0.0, self._noise_floor)
        return is_speech

    def _start_utterance(self):
        self._utterance_active = True
        self._speech_candidate_active = False
        # The pre-roll may be shorter than the onset threshold.  Retain the
        # complete candidate speech run as well, otherwise the first word can
        # be clipped when onset spans several network chunks.
        pre_roll = (np.concatenate(list(self._pre_roll_buffer))
                    if self._pre_roll_buffer else np.array([], dtype=np.float32))
        prior_samples = max(0, len(pre_roll) - self._pending_speech_samples)
        self.audio_buffer = []
        if prior_samples:
            self.audio_buffer.append(pre_roll[:prior_samples])
        self.audio_buffer.extend(self._pending_speech_chunks)
        self._utterance_samples = prior_samples + self._pending_speech_samples
        self._pre_roll_buffer.clear()
        self._pre_roll_samples = 0
        self._silence_samples = 0
        self._pending_speech_samples = 0
        self._pending_speech_chunks = []

    def _process_audio_chunk(self, chunk):
        """Process one normalized PCM chunk (kept separate for deterministic tests)."""
        if not len(chunk):
            return
        chunk = np.asarray(chunk, dtype=np.float32)
        chunk_samples = len(chunk)
        is_speech = self._rms_is_speech(chunk)

        if not self._utterance_active:
            # A very short configured maximum is also a useful deterministic
            # boundary for callers that supply only a few large frames.  It
            # may use temporal variation, but never an absolute RMS cutoff:
            # stationary loud startup packets must remain idle.
            if (not self._noise_calibrated and
                    self._noise_calibration_samples >=
                    self.sample_rate * self.vad_max_utterance_seconds):
                values = np.asarray(self._noise_calibration_rms, dtype=np.float32)
                low = max(float(np.min(values)), self.vad_min_rms) if len(values) else 0.0
                relative_span = (
                    (float(np.max(values)) - low) / low if len(values) and low
                    else 0.0)
                if len(values) >= 2 and relative_span >= 0.25:
                    self._pending_speech_chunks = list(
                        self._noise_calibration_chunks)
                    self._pending_speech_samples = sum(
                        len(part) for part in self._pending_speech_chunks)
                    self._start_utterance()
                    self._flush_current_utterance(trim_trailing_silence=False)
                    return
            # Calibration may have reached its decision on this frame.  Add
            # the complete retained startup window exactly once; the current
            # frame is part of that window and must not be duplicated.
            replay = self._calibration_replay_chunks
            self._calibration_replay_chunks = []
            if replay:
                for replay_chunk in replay:
                    self._append_pre_roll(replay_chunk)
                    self._pending_speech_chunks.append(replay_chunk.copy())
                    self._pending_speech_samples += len(replay_chunk)
                is_speech = True
                replay_trailing = self._calibration_replay_trailing_samples
                self._calibration_replay_trailing_samples = 0
                if (self._pending_speech_samples >=
                        self.sample_rate * self.vad_min_speech_seconds):
                    self._start_utterance()
                    # The calibration window can already contain confirmed
                    # trailing silence (for example speech followed by the
                    # endpoint while startup calibration was running).
                    self._silence_samples = replay_trailing
                    if self._silence_samples >= (
                            self.sample_rate * self.vad_silence_seconds):
                        self._flush_current_utterance()
                    elif self._utterance_samples >= (
                            self.sample_rate * self.vad_max_utterance_seconds):
                        self._flush_current_utterance(
                            trim_trailing_silence=False)
                    return
            else:
                self._append_pre_roll(chunk)
            if is_speech:
                if not replay:
                    self._pending_speech_chunks.append(chunk.copy())
                    self._pending_speech_samples += chunk_samples
                if (self._pending_speech_samples >=
                        self.sample_rate * self.vad_min_speech_seconds):
                    self._start_utterance()
                    if self._utterance_samples >= (
                            self.sample_rate * self.vad_max_utterance_seconds):
                        self._flush_current_utterance()
            else:
                self._pending_speech_samples = 0
                self._pending_speech_chunks = []
                self._speech_candidate_active = False
            return

        # Every frame after onset belongs to the utterance, including quiet
        # phonemes and internal pauses.  Only the confirmed trailing endpoint
        # silence is removed immediately before transcription.
        self.audio_buffer.append(chunk.copy())
        self._utterance_samples += chunk_samples
        if is_speech:
            self._silence_samples = 0
        else:
            self._silence_samples += chunk_samples

        if self._silence_samples >= self.sample_rate * self.vad_silence_seconds:
            self._flush_current_utterance()
        elif self._utterance_samples >= (
                self.sample_rate * self.vad_max_utterance_seconds):
            # A hard duration boundary is not proof that the current quiet
            # frame is endpoint silence; retain it in the forced segment.
            self._flush_current_utterance(trim_trailing_silence=False)

    def _trim_trailing_silence(self):
        """Remove only the endpoint silence confirmed by the VAD."""
        trim_samples = min(self._silence_samples, self._utterance_samples)
        while trim_samples and self.audio_buffer:
            last = self.audio_buffer[-1]
            if len(last) <= trim_samples:
                trim_samples -= len(last)
                self.audio_buffer.pop()
            else:
                self.audio_buffer[-1] = last[:-trim_samples]
                trim_samples = 0
        self._utterance_samples = sum(len(part) for part in self.audio_buffer)

    def _flush_current_utterance(self, trim_trailing_silence=True):
        if self._utterance_active and self.audio_buffer:
            if trim_trailing_silence:
                self._trim_trailing_silence()
            self._transcribe_buffer()
        self._reset_vad_state(reset_noise_floor=False)

    def _flush_for_stop(self):
        """Flush a final active (or still-starting) utterance on Stop."""
        if self._utterance_active:
            # Stop is explicit rather than a confirmed silence endpoint. Keep
            # the final quiet speech frame; natural-pause flushes trim only
            # after the full silence threshold has elapsed.
            self._flush_current_utterance(trim_trailing_silence=False)
        elif self._pending_speech_samples:
            # Stop is explicit user intent; do not discard a short final word
            # merely because it did not reach the normal onset duration.
            self._start_utterance()
            self._flush_current_utterance(trim_trailing_silence=False)
        elif (not self._noise_calibrated and
              self._noise_calibration_samples >=
              self.sample_rate * self.vad_min_speech_seconds and
              len(self._noise_calibration_rms) >= 2):
            # Stop can arrive before the calibration window completes.  Two
            # or more frames provide temporal evidence; unlike the old
            # absolute-RMS shortcut, one loud startup frame is never enough.
            values = np.asarray(self._noise_calibration_rms, dtype=np.float32)
            low = max(float(np.min(values)), self.vad_min_rms)
            relative_span = (float(np.max(values)) - low) / low
            if relative_span >= 0.25:
                self._pending_speech_chunks = list(self._noise_calibration_chunks)
                self._pending_speech_samples = sum(
                    len(part) for part in self._pending_speech_chunks)
                self._start_utterance()
                self._flush_current_utterance(trim_trailing_silence=False)
            else:
                self._reset_vad_state(reset_noise_floor=False)
        else:
            self._reset_vad_state(reset_noise_floor=False)

    @staticmethod
    def _normalize_text(text):
        replacements = {"{period}": ".", "{comma}": ",", "{colon}": ":",
                        "{semicolon}": ";", "{question mark}": "?",
                        "{exclamation mark}": "!", "{new paragraph}": "\n\n",
                        "{new line}": "\n"}
        normalized = text.replace("</s>", "").replace("<s>", "")
        for token, replacement in replacements.items():
            normalized = normalized.replace(token, replacement)
        normalized = re.sub(r"\s+([,.;:?!])", r"\1", normalized)
        normalized = re.sub(r"[ \t]*\n[ \t]*", "\n", normalized)
        return re.sub(r"[ \t]{2,}", " ", normalized).strip()

    def _transcribe_buffer(self):
        if not self.audio_buffer or self.model is None:
            return
        audio = np.concatenate(self.audio_buffer)
        self.audio_buffer = []
        import torch
        started = time.time()
        inputs = self.processor(audio, sampling_rate=self.sample_rate,
                                return_tensors="pt", padding=True).to(self.device)
        with torch.inference_mode():
            if hasattr(self.model, "generate"):
                ids = self.model.generate(**inputs)
            else:
                ids = torch.argmax(self.model(**inputs).logits, dim=-1)
        text = self._normalize_text(self.processor.batch_decode(ids)[0])
        self.latency_ms = round((time.time() - started) * 1000, 1)
        if text:
            for callback in self.callbacks["final"]:
                callback(text + " ", self.latency_ms)
            self._check_commands(text)

    def _check_commands(self, text):
        lowered = text.lower()
        for command in self.voice_commands:
            if command.lower() in lowered:
                for callback in self.callbacks["command"]:
                    callback(command, text)
                return command
        return None

    def update_config(self, medical_vocab=None, voice_commands=None):
        if medical_vocab is not None: self.medical_vocab = medical_vocab
        if voice_commands is not None: self.voice_commands = voice_commands

    def get_metrics(self):
        return {"latency_ms": self.latency_ms, "model_type": "medasr",
                "device": self.device, "compute_type": self.compute_type,
                "is_recording": self.is_recording,
                "vocab_size": len(self.medical_vocab),
                "vad_utterance_active": self._utterance_active,
                "vad_noise_floor": self._noise_floor,
                "vad_silence_seconds": self.vad_silence_seconds,
                "vad_max_utterance_seconds": self.vad_max_utterance_seconds,
                "vad_pre_roll_seconds": self.vad_pre_roll_seconds,
                "vad_min_speech_seconds": self.vad_min_speech_seconds,
                "vad_queue_seconds": self.vad_queue_seconds,
                "vad_queue_max_samples": self._queue_max_samples,
                "vad_queue_samples": self._queued_samples,
                "vad_dropped_chunks": self._dropped_queue_chunks,
                "vad_dropped_samples": self._dropped_queue_samples,
                "vad_noise_calibrated": self._noise_calibrated,
                "vad_silence_elapsed": self._silence_samples / self.sample_rate,
                "vad_utterance_elapsed": self._utterance_samples / self.sample_rate}