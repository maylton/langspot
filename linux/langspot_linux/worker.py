"""Runs blocking work (network) on a thread and hands the result back on the GTK main loop."""
from __future__ import annotations

import threading
from typing import Any, Callable

from gi.repository import GLib


def run_async(work: Callable[[], Any], on_done: Callable[[Any], None] | None = None,
              on_error: Callable[[Exception], None] | None = None) -> None:
    def target() -> None:
        try:
            result = work()
        except Exception as error:  # delivered to the UI, which shows a toast
            if on_error:
                GLib.idle_add(_call, on_error, error)
            return
        if on_done:
            GLib.idle_add(_call, on_done, result)

    threading.Thread(target=target, daemon=True).start()


def _call(callback: Callable[[Any], None], value: Any) -> bool:
    callback(value)
    return GLib.SOURCE_REMOVE
