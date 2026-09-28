"""Native desktop launcher for the Too Damn Hot! web application."""

from __future__ import annotations

import argparse
import functools
import os
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

import webview


APP_TITLE = "Too Damn Hot!"
DEFAULT_DEV_URL = "http://127.0.0.1:8443"


def resource_root() -> Path:
    """Return the source directory or PyInstaller's temporary bundle directory."""
    if getattr(sys, "frozen", False):
        return Path(sys._MEIPASS)  # type: ignore[attr-defined]
    return Path(__file__).resolve().parent


class AppRequestHandler(SimpleHTTPRequestHandler):
    """Serve only packaged files and keep the desktop console quiet."""

    def list_directory(self, path: str):  # type: ignore[no-untyped-def]
        self.send_error(404)
        return None

    def log_message(self, format: str, *args: object) -> None:
        return


def start_app_server() -> tuple[ThreadingHTTPServer, str]:
    dist_directory = resource_root() / "dist"
    if not (dist_directory / "index.html").is_file():
        raise FileNotFoundError(
            "The frontend bundle is missing. Run `pnpm run build` before "
            "launching the packaged app."
        )

    handler = functools.partial(AppRequestHandler, directory=str(dist_directory))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    server.daemon_threads = True
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    host, port = server.server_address
    return server, f"http://{host}:{port}/"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=f"Launch {APP_TITLE} as a desktop app.")
    parser.add_argument(
        "--dev",
        action="store_true",
        help="Load the running Vite development server instead of packaged files.",
    )
    parser.add_argument(
        "--url",
        default=os.environ.get("TOO_DAMN_HOT_DEV_URL", DEFAULT_DEV_URL),
        help="Development server URL used with --dev.",
    )
    return parser.parse_args()


def validate_dev_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("--url must be a valid http or https URL")
    return url


def main() -> None:
    args = parse_args()
    server: ThreadingHTTPServer | None = None

    try:
        if args.dev:
            app_url = validate_dev_url(args.url)
        else:
            server, app_url = start_app_server()

        webview.create_window(
            APP_TITLE,
            app_url,
            width=1440,
            height=900,
            min_size=(960, 640),
        )
        webview.start()
    finally:
        if server is not None:
            server.shutdown()
            server.server_close()


if __name__ == "__main__":
    main()
