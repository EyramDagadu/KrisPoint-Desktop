"""Terminate a packaged sidecar when its Tauri parent is gone."""

import os
import threading
import time


def parent_is_alive(parent_pid):
    if parent_pid <= 0:
        return False
    if os.name == "nt":
        import ctypes

        synchronize = 0x00100000
        wait_timeout = 0x00000102
        kernel32 = ctypes.windll.kernel32
        handle = kernel32.OpenProcess(synchronize, False, parent_pid)
        if not handle:
            return False
        try:
            return kernel32.WaitForSingleObject(handle, 0) == wait_timeout
        finally:
            kernel32.CloseHandle(handle)

    try:
        os.kill(parent_pid, 0)
        return True
    except OSError:
        return False


def start_parent_watchdog():
    parent_pid = int(os.getenv("KRISPOINT_PARENT_PID", "0"))
    if parent_pid <= 0:
        return

    def watch():
        while True:
            if not parent_is_alive(parent_pid):
                os._exit(0)
            time.sleep(2)

    threading.Thread(target=watch, daemon=True).start()