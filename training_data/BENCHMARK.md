# Ghanaian radiology ASR benchmark

## Verified benchmark result

One de-identified, human-transcribed Ghanaian radiology recording was supplied.
The 3.614-second clip says: `Ill defined opacity present`.

| Metric | MedASR | Faster-Whisper medium |
| --- | ---: | ---: |
| Word error rate | 0% | 0% |
| Medical-term error rate | 0% | 0% |
| Command accuracy | 100% | 100% |
| Inference latency | 9,143.9 ms | 12,075.6 ms |
| Peak process RAM | 789.3 MiB | 1,800.8 MiB |

Both engines returned `Ill-defined opacity present.` and recognized both annotated
medical terms (`ill defined` and `opacity`). Neither showed a specialty vocabulary
gap on this clip. The clip contains no spoken command, so the 100% command score
means only that neither engine produced a false command; positive command recall
was not tested.

### Recommendation

Keep MedASR as the provisional default. Accuracy was tied on the verified sample,
while MedASR used about 56% less peak RAM and completed inference about 24% sooner
on the same CPU environment.

This confirms that MedASR understands this real Ghanaian radiology phrase, not
that it is generally accurate for Ghanaian radiology dictation. One four-word clip
is not representative of accents, modalities, medication names, or KrisPoint
commands. Run the same benchmark on a larger set before treating the engine choice
as final.

The complete machine-readable result and provenance are in
`training_data/benchmark_results.json`.

## Earlier operational smoke result

Before verified data was supplied, both engines successfully transcribed the
repository's unverified 3.584-second WAV. Those measurements are retained in
`training_data/benchmark_smoke_result.json` as operational evidence only and were
not used in the recommendation.

## Required dataset

Use de-identified recordings from consenting Ghanaian radiologists. Include a mix
of CT, MRI, X-ray, ultrasound, medication names, Ghanaian/British spellings, and
KrisPoint commands. Each manifest item must have:

- a human-verified verbatim transcript;
- the medical terms that must be scored;
- any spoken KrisPoint commands;
- verified locale and specialty metadata.

Do not use an ASR engine's own output as ground truth.

## Run

From the repository root:

```sh
uv run python scripts/asr_benchmark.py \
  --manifest training_data/benchmark_manifest.json \
  --output training_data/benchmark_results.json \
  --engines medasr faster-whisper \
  --whisper-model medium \
  --whisper-revision 08e178d48790749d25932bbc082711ddcfdfbc4f \
  --medasr-revision ae1e4845b4b07479735d93e1e591e566435b7104
```

The script deliberately fails if any verified transcript is missing. Each engine
runs in a fresh process. The JSON output reports corpus word error rate,
occurrence-aware medical-term miss rate, sample-level command accuracy, mean
inference latency, peak process RAM, per-sample transcripts, and recurrent missed
terms. Command accuracy is the fraction of samples where the complete multiset of
detected command phrases exactly matches the annotated commands. It penalizes
both missed commands and false detections, including clips with no command.

Peak RAM includes the Python process and loaded model. Latency measures inference,
not model download/load time. Results record audio checksums, platform, Python
version, model/device configuration, and per-engine model metadata. Run both
engines on the same Linux machine with warmed model caches and the committed lock
file for a fair comparison.

## Decision rule

Prefer the engine with the lower medical-term error rate if its command accuracy
is not worse and its latency/RAM fit the deployment machine. Treat overall WER as
secondary for clinical dictation. Document recurrent missed terms as specialty
vocabulary gaps rather than hiding them with post-processing.