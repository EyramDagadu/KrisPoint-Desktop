"""Exercise an installed KrisPoint MedASR runtime through its authenticated socket."""
import argparse
import asyncio
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
            websocket = await websockets.connect(url, open_timeout=5)
            await receive_type(websocket, "connected", timeout=5)
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

            await websocket.send(json.dumps({"type": "start"}))
            await receive_type(websocket, "status")
            for offset in range(0, len(pcm), 32000):
                await websocket.send(pcm[offset:offset + 32000])
            await websocket.send(json.dumps({"type": "stop"}))
            text = ""
            stopped = False
            deadline = asyncio.get_running_loop().time() + 180
            while not text or not stopped:
                remaining = deadline - asyncio.get_running_loop().time()
                if remaining <= 0:
                    raise RuntimeError("Timed out waiting for transcription and stop status")
                message = json.loads(await asyncio.wait_for(websocket.recv(), remaining))
                if message.get("type") == "transcription":
                    text = message.get("data", {}).get("text", "").strip()
                elif (message.get("type") == "status"
                      and message.get("data", {}).get("message") == "Recording stopped"):
                    stopped = True
                elif message.get("type") == "error":
                    raise RuntimeError(message.get("data", {}).get("message", "Voice server error"))
            if not text:
                raise RuntimeError("Installed MedASR runtime returned an empty transcription")
            print(f"Offline installed MedASR transcription succeeded ({len(text)} characters)")
            await websocket.close()
            stop_path.touch()
            if await asyncio.to_thread(process.wait, 30) != 0:
                raise RuntimeError(f"KrisPoint smoke mode exited with {process.returncode}")
            try:
                await websockets.connect(url, open_timeout=2)
                raise RuntimeError("Voice socket remained available after KrisPoint shut down")
            except (OSError, asyncio.TimeoutError):
                pass
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
    asyncio.run(verify(parser.parse_args()))


if __name__ == "__main__":
    main()