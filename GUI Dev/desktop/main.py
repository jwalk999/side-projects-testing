"""Launch the Vite application in a native pywebview window."""

from __future__ import annotations

import argparse
from pathlib import Path

import webview


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DIST_INDEX = PROJECT_ROOT / "dist" / "index.html"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Launch Too Damn Hot! as a desktop application.")
    parser.add_argument(
        "--dev-url",
        help="Load a running Vite development server instead of the production bundle.",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable pywebview debug mode and browser developer tools.",
    )
    return parser.parse_args()


def app_url(dev_url: str | None) -> str:
    if dev_url:
        return dev_url

    if not DIST_INDEX.is_file():
        raise SystemExit(
            "Desktop bundle not found. Run `pnpm desktop:build` before launching "
            "`python desktop/main.py`."
        )

    # Passing a local path lets pywebview host it with its internal HTTP server.
    # This avoids file:// module restrictions while retaining relative Vite assets.
    return str(DIST_INDEX)


def main() -> None:
    args = parse_args()
    webview.create_window(
        "Too Damn Hot!",
        app_url(args.dev_url),
        width=1440,
        height=900,
        min_size=(1024, 700),
    )
    webview.start(debug=args.debug)


if __name__ == "__main__":
    main()
