# Desktop webview usage

The desktop application is the same React application used in the browser.
pywebview supplies a native window and an embedded browser engine; it does not
reimplement the interface in Python. This keeps Astra components, Tailwind
utilities, CSS custom properties, fonts, animations, and Open-Meteo behavior
consistent between targets.

## Prerequisites

- Node.js and pnpm versions from `.mise.toml`
- Python 3.10 or newer
- A pywebview-compatible system web engine

Install JavaScript and Python dependencies:

```bash
pnpm install
python -m venv .venv
source .venv/bin/activate
python -m pip install -r desktop/requirements.txt
```

Linux may require GTK, WebKitGTK, or Qt packages supplied by the distribution.
See the pywebview installation guide for the selected Linux backend. Windows
uses WebView2 when available, and macOS uses WKWebView.

## Production mode

Build the desktop-specific Vite bundle:

```bash
pnpm desktop:build
```

This invokes Vite in `desktop` mode. `vite.config.ts` uses a relative asset base
for that mode so `desktop/main.py` can serve the files from `dist/`.

Launch it:

```bash
python desktop/main.py
```

Rebuild after changing React, TypeScript, or CSS source.

## Development mode

Run Vite in one terminal:

```bash
pnpm dev
```

Then point pywebview at that server in a second terminal:

```bash
python desktop/main.py --dev-url http://127.0.0.1:8443
```

Use the port shown by Vite if it differs. Development mode retains Vite hot
reload. Add `--debug` to expose webview developer tools:

```bash
python desktop/main.py --dev-url http://127.0.0.1:8443 --debug
```

## Data and permissions

The React data layer continues to request `https://api.open-meteo.com`
directly. No Python API bridge or API key is required. The host must have
internet access, and its embedded browser engine must permit HTTPS requests.

## Packaging

Package only after `pnpm desktop:build` has produced `dist/`. A packager such
as PyInstaller must include that directory as application data and preserve
this relationship:

```text
application root/
├── desktop/main.py
└── dist/index.html
```

If a packager relocates bundled resources to a temporary directory, adjust
`PROJECT_ROOT` in `desktop/main.py` using that packager's documented resource
path. Test the packaged app on each target operating system because pywebview
uses the platform's native browser engine.

## Troubleshooting

- **“Desktop bundle not found”**: run `pnpm desktop:build`.
- **Blank window after packaging**: confirm the complete `dist/` directory was
  bundled and is adjacent to the resolved project root.
- **Missing styles**: use `desktop:build`, not the normal web build copied from
  another deployment. Check that `styles/global.css` is present during build.
- **Network error**: verify the machine can reach Open-Meteo over HTTPS.
- **Linux window does not open**: install a supported GTK/WebKitGTK or Qt
  backend for pywebview.
