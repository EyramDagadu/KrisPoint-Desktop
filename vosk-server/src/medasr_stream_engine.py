"""Streaming adapter for Google's gated MedASR medical speech model."""
import os
import queue
import re
import sys
import threading
import time
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
        self.audio_queue = queue.Queue()
        self.audio_buffer = []
        self.callbacks = {"partial": [], "final": [], "command": []}
        self.latency_ms = 0
        self.processing_thread = None

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
        if self.is_recording:
            return
        self.is_recording = True
        self.audio_buffer = []
        self.processing_thread = threading.Thread(target=self._process_audio, daemon=True)
        self.processing_thread.start()

    def stop_processing(self):
        self.is_recording = False
        if self.processing_thread:
            self.processing_thread.join()
            self.processing_thread = None
        self.audio_buffer = []

    def feed_audio(self, audio_data):
        self.audio_queue.put(audio_data)

    def _process_audio(self):
        while self.is_recording or not self.audio_queue.empty():
            try:
                chunk = self.audio_queue.get(timeout=.05)
            except queue.Empty:
                continue
            if isinstance(chunk, bytes):
                chunk = np.frombuffer(chunk, dtype=np.int16).astype(np.float32) / 32768
            self.audio_buffer.append(np.asarray(chunk, dtype=np.float32))
            if sum(len(c) for c in self.audio_buffer) >= self.sample_rate * 3:
                self._transcribe_buffer()
        if self.audio_buffer:
            self._transcribe_buffer()

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
                "vocab_size": len(self.medical_vocab)}