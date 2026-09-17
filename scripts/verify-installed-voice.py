"""Exercise an installed KrisPoint MedASR runtime through its authenticated socket."""
import argparse
import asyncio
import csv
import hashlib
import hmac
import json
import os
from pathlib import Path
import secrets
import subprocess
import sys
import tempfile
import time
import wave

import websockets

MIB = 1024 * 1024
COMPONENTS = ("tauri", "node", "medasr", "other")


async def receive_type(websocket, expected_type, timeout=180):
    while True:
        message = json.loads(await asyncio.wait_for(websocket.recv(), timeout))
        if message.get("type") == "error":
            raise RuntimeError(message.get("data", {}).get("message", "Voice server error"))
        if message.get("type") == expected_type:
            return message


def print_voice_log(log_path):
    if log_path.is_file():
        print(f"===== {log_path} =====", file=sys.stderr)
        print(log_path.read_text(errors="replace"), file=sys.stderr)


def wait_for_app_endpoint(result_path, log_path, process):
    for _ in range(9000):
        if process.poll() is not None:
            print_voice_log(log_path)
            raise RuntimeError(f"KrisPoint exited during voice startup with {process.returncode}")
        if result_path.is_file():
            return json.loads(result_path.read_text())["url"]
        time.sleep(.1)
    print_voice_log(log_path)
    raise RuntimeError("KrisPoint did not start its voice runtime within fifteen minutes")


def process_rows_windows():
    command = [
        "powershell.exe", "-NoProfile", "-NonInteractive", "-Command",
        "Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,"
        "WorkingSetSize,Name,CommandLine | ConvertTo-Json -Compress",
    ]
    output = subprocess.check_output(command, text=True, timeout=20,
                                     stderr=subprocess.DEVNULL)
    parsed = json.loads(output)
    if isinstance(parsed, dict):
        parsed = [parsed]
    return [{
        "pid": int(row["ProcessId"]),
        "ppid": int(row["ParentProcessId"]),
        "rss": int(row.get("WorkingSetSize") or 0),
        "command": f'{row.get("Name") or ""} {row.get("CommandLine") or ""}',
    } for row in parsed]


def process_rows_posix():
    output = subprocess.check_output(
        ["ps", "-axo", "pid=,ppid=,rss=,command="], text=True, timeout=10)
    rows = []
    for line in output.splitlines():
        fields = line.strip().split(None, 3)
        if len(fields) < 3:
            continue
        rows.append({
            "pid": int(fields[0]),
            "ppid": int(fields[1]),
            "rss": int(fields[2]) * 1024,
            "command": fields[3] if len(fields) == 4 else "",
        })
    return rows


def classify_process(row, root_pid):
    if row["pid"] == root_pid:
        return "tauri"
    command = row["command"].lower()
    if ("krispoint-voice" in command or "websocket_server.py" in command
            or "medasr" in command):
        return "medasr"
    if "node" in command:
        return "node"
    return "other"


def process_tree_memory(root_pid):
    rows = process_rows_windows() if os.name == "nt" else process_rows_posix()
    by_parent = {}
    for row in rows:
        by_parent.setdefault(row["ppid"], []).append(row)
    descendants = []
    pending = [root_pid]
    seen = set()
    while pending:
        parent = pending.pop()
        if parent in seen:
            continue
        seen.add(parent)
        for child in by_parent.get(parent, []):
            descendants.append(child)
            pending.append(child["pid"])
    root = next((row for row in rows if row["pid"] == root_pid), None)
    selected = ([root] if root else []) + descendants
    totals = {component: 0 for component in COMPONENTS}
    pids = {component: [] for component in COMPONENTS}
    for row in selected:
        component = classify_process(row, root_pid)
        totals[component] += row["rss"]
        pids[component].append(row["pid"])
    return totals, pids


class MemoryMonitor:
    def __init__(self, root_pid, output_path, interval):
        self.root_pid = root_pid
        self.output_path = output_path
        self.interval = interval
        self.samples = []
        self.baseline_index = None
        self._stop = asyncio.Event()

    async def run(self):
        while not self._stop.is_set():
            try:
                totals, pids = await asyncio.to_thread(
                    process_tree_memory, self.root_pid)
                self.samples.append({
                    "elapsed_seconds": round(time.monotonic() - self.started, 2),
                    "phase": "warmup" if self.baseline_index is None else "soak",
                    "bytes": totals,
                    "pids": pids,
                })
            except (OSError, subprocess.SubprocessError, ValueError,
                    json.JSONDecodeError) as error:
                print(f"Memory sample warning: {error}", file=sys.stderr)
            try:
                await asyncio.wait_for(self._stop.wait(), self.interval)
            except asyncio.TimeoutError:
                pass

    async def __aenter__(self):
        self.started = time.monotonic()
        self.task = asyncio.create_task(self.run())
        return self

    async def __aexit__(self, *_):
        self._stop.set()
        await self.task
        self.write_report()

    def write_report(self):
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        with self.output_path.open("w", newline="") as stream:
            writer = csv.writer(stream)
            writer.writerow(["elapsed_seconds", "phase", *[
                value for component in COMPONENTS for value in (
                    f"{component}_rss_mib", f"{component}_processes")]])
            for sample in self.samples:
                writer.writerow([sample["elapsed_seconds"], sample["phase"], *[
                    value for component in COMPONENTS for value in (
                        round(sample["bytes"][component] / MIB, 2),
                        len(sample["pids"][component]))]])

    async def mark_steady_state(self):
        self.baseline_index = len(self.samples)
        await asyncio.sleep(self.interval)

    def validate(self, peak_limits_mib, growth_limit_mib):
        if self.baseline_index is None or len(self.samples) < self.baseline_index + 2:
            raise RuntimeError("Memory monitor did not collect enough samples")
        failures = []
        for component in COMPONENTS:
            values = [sample["bytes"][component] / MIB
                      for sample in self.samples]
            steady_values = values[self.baseline_index:]
            comparison_size = min(3, max(1, len(steady_values) // 3))
            baseline = sum(steady_values[:comparison_size]) / comparison_size
            final = sum(steady_values[-comparison_size:]) / comparison_size
            peak = max(values)
            peak_processes = max(
                len(sample["pids"][component]) for sample in self.samples)
            growth = final - baseline
            print(f"{component}: peak={peak:.1f} MiB, "
                  f"steady_growth={growth:.1f} MiB, "
                  f"peak_processes={peak_processes}")
            limit = peak_limits_mib.get(component)
            if limit is not None and peak > limit:
                failures.append(
                    f"{component} peak {peak:.1f} MiB exceeded {limit} MiB")
            if growth > growth_limit_mib:
                failures.append(
                    f"{component} growth {growth:.1f} MiB exceeded "
                    f"{growth_limit_mib} MiB")
            if component == "medasr" and peak_processes > 1:
                failures.append(
                    f"MedASR spawned {peak_processes} processes; expected one")
        if failures:
            raise RuntimeError("Memory ceiling failed: " + "; ".join(failures))


async def open_authenticated_socket(url):
    websocket = await websockets.connect(url, open_timeout=5)
    await receive_type(websocket, "connected", timeout=5)
    return websocket


async def stream_session(websocket, pcm, duration_seconds=None):
    await websocket.send(json.dumps({"type": "start"}))
    await receive_type(websocket, "status")
    packet_bytes = 16000 * 2 // 10
    deadline = (time.monotonic() + duration_seconds
                if duration_seconds else None)
    sent_once = False
    while not sent_once or (deadline and time.monotonic() < deadline):
        sent_once = True
        for offset in range(0, len(pcm), packet_bytes):
            await websocket.send(pcm[offset:offset + packet_bytes])
            if deadline and time.monotonic() >= deadline:
                break
            await asyncio.sleep(.1)
        if not deadline:
            break
    await websocket.send(json.dumps({"type": "stop"}))
    text = ""
    stopped = False
    timeout_at = asyncio.get_running_loop().time() + 180
    while not stopped:
        remaining = timeout_at - asyncio.get_running_loop().time()
        if remaining <= 0:
            raise RuntimeError("Timed out waiting for transcription and stop status")
        message = json.loads(await asyncio.wait_for(websocket.recv(), remaining))
        if message.get("type") == "transcription":
            text += message.get("data", {}).get("text", "").strip()
        elif (message.get("type") == "status"
              and message.get("data", {}).get("message") == "Recording stopped"):
            stopped = True
        elif message.get("type") == "error":
            raise RuntimeError(message.get("data", {}).get(
                "message", "Voice server error"))
    if not text:
        raise RuntimeError("Installed MedASR runtime returned an empty transcription")
    return text


async def verify(args):
    application = Path(args.application).resolve()
    audio_path = Path(args.audio).resolve()
    if not application.is_file():
        raise RuntimeError(f"Installed KrisPoint executable is missing: {application}")

    with wave.open(str(audio_path), "rb") as audio:
        if (audio.getnchannels(), audio.getframerate(), audio.getsampwidth()) != (1, 16000, 2):
            raise RuntimeError("Smoke audio must be mono 16 kHz 16-bit PCM")
        pcm = audio.readframes(audio.getnframes())

    with tempfile.TemporaryDirectory(prefix="krispoint-offline-smoke-") as temporary:
        result_path = Path(temporary) / "ready.json"
        stop_path = Path(temporary) / "stop"
        log_path = Path(temporary) / "voice.log"
        environment = {
            "ASR_ENGINE": "medasr",
            "HF_HUB_OFFLINE": "1",
            "HOME": os.environ.get("HOME", str(Path.home())),
            "KRISPOINT_OFFLINE_VOICE_SMOKE_RESULT": str(result_path),
            "KRISPOINT_OFFLINE_VOICE_SMOKE_LOG": str(log_path),
            "KRISPOINT_OFFLINE_VOICE_SMOKE_STOP": str(stop_path),
            "MEDASR_DEVICE": "cpu",
            "NO_PROXY": "127.0.0.1,localhost",
            "PATH": os.path.join(os.environ.get("SystemRoot", "/usr"), "System32")
                    if os.name == "nt" else "/usr/bin:/bin",
            "TRANSFORMERS_OFFLINE": "1",
        }
        if os.name == "nt":
            environment["SystemRoot"] = os.environ["SystemRoot"]

        process = subprocess.Popen(
            [str(application)],
            cwd=application.parent,
            env=environment,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )
        try:
            url = await asyncio.to_thread(wait_for_app_endpoint, result_path, log_path, process)
            token = url.split("token=", 1)[1]
            websocket = await open_authenticated_socket(url)
            invalid_url = url.split("token=", 1)[0] + "token=invalid"
            try:
                async with websockets.connect(invalid_url, open_timeout=5) as denied:
                    await denied.recv()
                raise RuntimeError("Voice runtime accepted an invalid client token")
            except websockets.ConnectionClosed as closed:
                if closed.code != 1008:
                    raise RuntimeError(f"Invalid client token closed with {closed.code}, not 1008")

            nonce = secrets.token_hex(32)
            await websocket.send(json.dumps({"type": "health", "nonce": nonce}))
            health = await receive_type(websocket, "health")
            proof = health["data"].get("proof", "")
            expected = hmac.new(token.encode(), nonce.encode(), hashlib.sha256).hexdigest()
            if health["data"].get("service") != "krispoint-voice" or not hmac.compare_digest(proof, expected):
                raise RuntimeError("Voice runtime returned an invalid authenticated health proof")

            report_path = Path(args.memory_report).resolve()
            peak_limits = {
                "tauri": args.max_tauri_mib,
                "node": args.max_node_mib,
                "medasr": args.max_medasr_mib,
                "other": args.max_other_mib,
            }
            async with MemoryMonitor(
                    process.pid, report_path, args.sample_interval) as monitor:
                text = await stream_session(websocket, pcm)
                print(f"Warm-up transcription succeeded ({len(text)} characters)")
                await monitor.mark_steady_state()
                text = await stream_session(websocket, pcm, args.continuous_seconds)
                print("Continuous installed MedASR transcription succeeded "
                      f"({len(text)} characters)")
                for session in range(args.repeat_sessions):
                    text = await stream_session(websocket, pcm)
                    print(f"Repeated session {session + 1}/"
                          f"{args.repeat_sessions} succeeded ({len(text)} characters)")
                for cycle in range(args.reconnect_cycles):
                    await websocket.close()
                    websocket = await open_authenticated_socket(url)
                    text = await stream_session(websocket, pcm)
                    print(f"Reconnect cycle {cycle + 1}/"
                          f"{args.reconnect_cycles} succeeded ({len(text)} characters)")
                await websocket.close()
                await asyncio.sleep(args.sample_interval)
            monitor.validate(peak_limits, args.max_growth_mib)
            print(f"Memory samples written to {report_path}")
            stop_path.touch()
            if await asyncio.to_thread(process.wait, 30) != 0:
                raise RuntimeError(f"KrisPoint smoke mode exited with {process.returncode}")
            try:
                await websockets.connect(url, open_timeout=2)
                raise RuntimeError("Voice socket remained available after KrisPoint shut down")
            except (OSError, asyncio.TimeoutError):
                pass
        except Exception:
            print_voice_log(log_path)
            raise
        finally:
            if process.poll() is None:
                stop_path.touch()
                try:
                    process.wait(timeout=15)
                except subprocess.TimeoutExpired:
                    process.terminate()
                    try:
                        process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        process.kill()
                        process.wait(timeout=5)
            if process.stdout and process.returncode not in (0, None):
                print(process.stdout.read(), file=sys.stderr)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--application", required=True)
    parser.add_argument("--audio", required=True)
    parser.add_argument("--continuous-seconds", type=float, default=180)
    parser.add_argument("--repeat-sessions", type=int, default=3)
    parser.add_argument("--reconnect-cycles", type=int, default=3)
    parser.add_argument("--sample-interval", type=float, default=2)
    parser.add_argument("--memory-report", default="memory-soak.csv")
    parser.add_argument("--max-tauri-mib", type=float, default=1536)
    parser.add_argument("--max-node-mib", type=float, default=1536)
    parser.add_argument("--max-medasr-mib", type=float, default=8192)
    parser.add_argument("--max-other-mib", type=float, default=1024)
    parser.add_argument("--max-growth-mib", type=float, default=768)
    asyncio.run(verify(parser.parse_args()))


if __name__ == "__main__":
    main()