#!/usr/bin/env python3
"""Compare MedASR and faster-whisper on paired radiology audio/transcripts."""

from __future__ import annotations

import argparse
from collections import Counter
import hashlib
from importlib.metadata import PackageNotFoundError, version
import json
import os
import platform
import re
import resource
import subprocess
import sys
import time
import wave
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
ENGINE_DIR = ROOT / "vosk-server" / "src"
sys.path.insert(0, str(ENGINE_DIR))
DEFAULT_WHISPER_REVISION = "08e178d48790749d25932bbc082711ddcfdfbc4f"
DEFAULT_MEDASR_REVISION = "ae1e4845b4b07479735d93e1e591e566435b7104"


def words(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+(?:'[a-z0-9]+)?", text.lower())


def edit_distance(reference: list[str], hypothesis: list[str]) -> int:
    previous = list(range(len(hypothesis) + 1))
    for row, expected in enumerate(reference, 1):
        current = [row]
        for column, actual in enumerate(hypothesis, 1):
            current.append(
                min(
                    current[-1] + 1,
                    previous[column] + 1,
                    previous[column - 1] + (expected != actual),
                )
            )
        previous = current
    return previous[-1]


def error_rate(reference: Iterable[str], hypothesis: Iterable[str]) -> float | None:
    reference = list(reference)
    hypothesis = list(hypothesis)
    return edit_distance(reference, hypothesis) / len(reference) if reference else None


def load_audio(path: Path) -> np.ndarray:
    with wave.open(str(path), "rb") as wav:
        if wav.getnchannels() != 1 or wav.getframerate() != 16000:
            raise ValueError(f"{path}: expected mono 16 kHz WAV")
        if wav.getsampwidth() != 2:
            raise ValueError(f"{path}: expected 16-bit PCM WAV")
        return np.frombuffer(wav.readframes(wav.getnframes()), np.int16).astype(np.float32) / 32768


def transcribe(
    engine_name: str,
    audio: np.ndarray,
    whisper_model: str,
    whisper_revision: str,
    medasr_revision: str,
) -> dict:
    if engine_name == "medasr":
        from medasr_stream_engine import MedASRStreamEngine

        os.environ["MEDASR_MODEL_REVISION"] = medasr_revision
        engine = MedASRStreamEngine()
        engine.load_model()
        import torch

        started = time.perf_counter()
        inputs = engine.processor(
            audio, sampling_rate=engine.sample_rate, return_tensors="pt", padding=True
        ).to(engine.device)
        with torch.inference_mode():
            if hasattr(engine.model, "generate"):
                output_ids = engine.model.generate(**inputs)
            else:
                output_ids = torch.argmax(engine.model(**inputs).logits, dim=-1)
        text = engine._normalize_text(engine.processor.batch_decode(output_ids)[0])
        result = {
            "text": text,
            "latency_ms": (time.perf_counter() - started) * 1000,
            "model": engine.model_id,
            "model_revision": engine.model_revision,
            "device": engine.device,
            "compute_type": engine.compute_type,
        }
        return result

    from whisper_stream_engine import WhisperStreamEngine

    os.environ["WHISPER_MODEL_REVISION"] = whisper_revision
    engine = WhisperStreamEngine(model_size=whisper_model)
    engine.load_model()
    started = time.perf_counter()
    segments, _ = engine.model.transcribe(
        audio,
        language="en",
        beam_size=5,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 500, "threshold": 0.5},
        condition_on_previous_text=False,
    )
    text = " ".join(segment.text.strip() for segment in segments).strip()
    result = {
        "text": text,
        "latency_ms": (time.perf_counter() - started) * 1000,
        "model": engine.model_path,
        "model_revision": engine.model_revision,
        "device": engine.device,
        "compute_type": engine.compute_type,
    }
    return result


def worker(args: argparse.Namespace) -> int:
    audio = load_audio(Path(args.audio))
    before = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    measurement = transcribe(
        args.engine,
        audio,
        args.whisper_model,
        args.whisper_revision,
        args.medasr_revision,
    )
    peak_kib = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    print(
        json.dumps(
            {
                **measurement,
                "latency_ms": round(measurement["latency_ms"], 1),
                "peak_ram_mb": round(max(before, peak_kib) / 1024, 1),
            }
        )
    )
    return 0


@dataclass
class Aggregate:
    reference_words: int = 0
    word_errors: int = 0
    medical_terms: int = 0
    medical_term_errors: int = 0
    command_samples: int = 0
    command_exact_matches: int = 0
    latency_ms: float = 0
    peak_ram_mb: float = 0
    samples: int = 0


def phrase_counts(tokens: list[str], phrases: Iterable[str]) -> Counter[str]:
    """Count non-overlapping token-boundary occurrences of each phrase."""
    counts: Counter[str] = Counter()
    for phrase in phrases:
        phrase_tokens = words(phrase)
        if not phrase_tokens:
            continue
        width = len(phrase_tokens)
        count = sum(
            tokens[index : index + width] == phrase_tokens
            for index in range(len(tokens) - width + 1)
        )
        if count:
            counts[" ".join(phrase_tokens)] = count
    return counts


def missed_phrases(expected: Iterable[str], hypothesis_tokens: list[str]) -> Counter[str]:
    expected_counts = Counter(" ".join(words(phrase)) for phrase in expected if words(phrase))
    found_counts = phrase_counts(hypothesis_tokens, expected_counts)
    return expected_counts - found_counts


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def validate_manifest(samples: list[dict], command_vocabulary: list[str]) -> None:
    vocabulary = {" ".join(words(command)) for command in command_vocabulary}
    for sample in samples:
        label = sample.get("audio", "<unknown>")
        transcript = sample.get("transcript")
        if not transcript or not words(transcript):
            raise ValueError(f"{label}: verified transcript is required")
        if sample.get("speaker_locale_verified") is not True:
            raise ValueError(f"{label}: speaker locale must be human-verified")
        if "ghana" not in sample.get("speaker_locale", "").lower():
            raise ValueError(f"{label}: speaker locale is not Ghanaian")
        if not sample.get("specialty") or sample["specialty"].lower() == "unverified":
            raise ValueError(f"{label}: radiology specialty must be verified")
        if sample.get("deidentified") is not True:
            raise ValueError(f"{label}: deidentified must be explicitly true")

        reference = words(transcript)
        for field in ("medical_terms", "commands"):
            annotations = sample.get(field, [])
            if any(not words(annotation) for annotation in annotations):
                raise ValueError(f"{label}: {field} contains an empty annotation")
            expected = Counter(" ".join(words(annotation)) for annotation in annotations)
            found = phrase_counts(reference, expected)
            absent = expected - found
            if absent:
                raise ValueError(
                    f"{label}: {field} annotations absent from transcript: {dict(absent)}"
                )
        unknown = {
            " ".join(words(command))
            for command in sample.get("commands", [])
            if " ".join(words(command)) not in vocabulary
        }
        if unknown:
            raise ValueError(f"{label}: commands outside command_vocabulary: {sorted(unknown)}")


def dependency_versions() -> dict[str, str]:
    packages = ["faster-whisper", "numpy", "torch", "transformers"]
    result = {}
    for package in packages:
        try:
            result[package] = version(package)
        except PackageNotFoundError:
            result[package] = "not-installed"
    return result


def evaluate(
    manifest_path: Path,
    engines: list[str],
    whisper_model: str,
    whisper_revision: str,
    medasr_revision: str,
) -> dict:
    manifest = json.loads(manifest_path.read_text())
    samples = manifest.get("samples", [])
    if not samples:
        raise ValueError("manifest contains no samples")

    command_vocabulary = manifest.get("command_vocabulary", [])
    if not command_vocabulary:
        command_vocabulary = sorted(
            {
                command
                for sample in samples
                for command in sample.get("commands", [])
            }
        )
    validate_manifest(samples, command_vocabulary)
    lock_path = ROOT / "uv.lock"
    results: dict = {
        "manifest": str(manifest_path),
        "provenance": {
            "platform": platform.platform(),
            "python": sys.version,
            "whisper_model": whisper_model,
            "whisper_revision": whisper_revision,
            "medasr_revision": medasr_revision,
            "engines": engines,
            "dependencies": dependency_versions(),
            "uv_lock_sha256": file_sha256(lock_path) if lock_path.exists() else None,
            "manifest_sha256": file_sha256(manifest_path),
            "benchmark_script_sha256": file_sha256(Path(__file__).resolve()),
            "ram_unit": "MiB; Linux ru_maxrss peak for each isolated worker process",
        },
        "engines": {},
    }
    for engine in engines:
        aggregate = Aggregate()
        vocabulary_gaps: Counter[str] = Counter()
        sample_results = []
        for sample in samples:
            audio_path = (manifest_path.parent / sample["audio"]).resolve()
            command = [
                sys.executable,
                str(Path(__file__).resolve()),
                "--worker",
                "--engine",
                engine,
                "--audio",
                str(audio_path),
                "--whisper-model",
                whisper_model,
                "--whisper-revision",
                whisper_revision,
                "--medasr-revision",
                medasr_revision,
            ]
            try:
                completed = subprocess.run(
                    command, check=True, text=True, capture_output=True, timeout=900
                )
                measurement = json.loads(completed.stdout.strip().splitlines()[-1])
            except (subprocess.SubprocessError, json.JSONDecodeError, IndexError) as exc:
                stderr = getattr(exc, "stderr", "") or ""
                raise RuntimeError(
                    f"{engine} failed for {sample['audio']}: {exc}; {stderr[-1000:]}"
                ) from exc
            reference = words(sample["transcript"])
            hypothesis = words(measurement["text"])
            if not reference:
                raise ValueError(f"{sample['audio']}: transcript has no scoreable words")
            expected_terms = sample.get("medical_terms", [])
            expected_commands = Counter(
                " ".join(words(term)) for term in sample.get("commands", []) if words(term)
            )
            predicted_commands = phrase_counts(hypothesis, command_vocabulary)
            predicted_commands = Counter(
                {phrase: count for phrase, count in predicted_commands.items() if count}
            )

            word_errors = edit_distance(reference, hypothesis)
            missed_terms = missed_phrases(expected_terms, hypothesis)
            term_errors = sum(missed_terms.values())
            vocabulary_gaps.update(missed_terms)
            aggregate.reference_words += len(reference)
            aggregate.word_errors += word_errors
            aggregate.medical_terms += len(expected_terms)
            aggregate.medical_term_errors += term_errors
            aggregate.command_samples += 1
            aggregate.command_exact_matches += predicted_commands == expected_commands
            aggregate.latency_ms += measurement["latency_ms"]
            aggregate.peak_ram_mb = max(aggregate.peak_ram_mb, measurement["peak_ram_mb"])
            aggregate.samples += 1
            sample_results.append(
                {
                    **measurement,
                    "audio": sample["audio"],
                    "audio_sha256": file_sha256(audio_path),
                    "word_errors": word_errors,
                    "missed_medical_terms": dict(missed_terms),
                    "expected_commands": dict(expected_commands),
                    "predicted_commands": dict(predicted_commands),
                    "command_exact_match": predicted_commands == expected_commands,
                }
            )

        results["engines"][engine] = {
            "wer": aggregate.word_errors / aggregate.reference_words,
            "medical_term_error_rate": (
                aggregate.medical_term_errors / aggregate.medical_terms
                if aggregate.medical_terms
                else None
            ),
            "command_accuracy": (
                aggregate.command_exact_matches / aggregate.command_samples
            ),
            "mean_latency_ms": aggregate.latency_ms / aggregate.samples,
            "peak_ram_mb": aggregate.peak_ram_mb,
            "vocabulary_gaps": dict(vocabulary_gaps.most_common()),
            "samples": sample_results,
        }
    return results


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--engines", nargs="+", choices=["medasr", "faster-whisper"])
    parser.add_argument("--whisper-model", default="medium")
    parser.add_argument("--whisper-revision", default=DEFAULT_WHISPER_REVISION)
    parser.add_argument("--medasr-revision", default=DEFAULT_MEDASR_REVISION)
    parser.add_argument("--worker", action="store_true", help=argparse.SUPPRESS)
    parser.add_argument("--engine", choices=["medasr", "faster-whisper"])
    parser.add_argument("--audio")
    args = parser.parse_args()
    if args.worker:
        return worker(args)
    if not args.manifest or not args.output or not args.engines:
        parser.error("--manifest, --output, and --engines are required")
    try:
        result = evaluate(
            args.manifest,
            args.engines,
            args.whisper_model,
            args.whisper_revision,
            args.medasr_revision,
        )
    except (ValueError, FileNotFoundError) as exc:
        parser.error(str(exc))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())