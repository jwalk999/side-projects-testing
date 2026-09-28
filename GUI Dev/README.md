# Too Damn Hot!

A React, Vite, and Astra UI weather-station console that can run in a browser
or in a native desktop window through pywebview.

## Browser development

```bash
pnpm install
pnpm dev
```

The Figma Make environment already runs the Vite server on `$PORT`.

## Desktop quick start

Create a Python virtual environment and install the desktop dependency:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r desktop/requirements.txt
```

On Windows, activate the environment with:

```powershell
.venv\Scripts\Activate.ps1
```

Build and launch:

```bash
pnpm desktop:build
python desktop/main.py
```

For operating-system prerequisites, development mode, and packaging, see
[docs/WEBVIEW.md](docs/WEBVIEW.md). For CSS token and font customization, see
[docs/STYLING.md](docs/STYLING.md).
