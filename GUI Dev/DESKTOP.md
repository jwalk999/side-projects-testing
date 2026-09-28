# Desktop packaging

The desktop build uses pywebview for the native window and PyInstaller for a
single-file Windows executable. The packaged application serves the production
Vite bundle from a private, ephemeral localhost port so browser APIs and the
Open-Meteo requests work normally.

## One-time setup

From PowerShell in the repository root, activate your Python virtual
environment and install the desktop dependencies:

```powershell
python -m pip install -r requirements-desktop.txt
```

pywebview uses the Microsoft Edge WebView2 runtime on Windows. It is included
with current Windows 10 and Windows 11 installations. If the runtime is missing,
install the Evergreen WebView2 Runtime from Microsoft.

## Development window

Start Vite in the first terminal:

```powershell
pnpm run dev
```

Then open the same hot-reloading app in a native window from a second terminal:

```powershell
pnpm run desktop:dev
```

The launcher defaults to `http://127.0.0.1:8443`. To use a different Vite
address, set `TOO_DAMN_HOT_DEV_URL` before running the launcher:

```powershell
$env:TOO_DAMN_HOT_DEV_URL = "http://127.0.0.1:5173"
pnpm run desktop:dev
```

## Build the Windows executable

Run the complete frontend and desktop packaging pipeline:

```powershell
pnpm run desktop:build
```

The executable is written to:

```text
desktop-dist/Too Damn Hot.exe
```

PyInstaller builds for the operating system it runs on, so create the Windows
executable on Windows. The executable includes the production web bundle and
does not require Node.js or a separate Python installation on the destination
computer. Internet access is still required for live Open-Meteo data.
