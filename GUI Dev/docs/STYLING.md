# CSS design-system integration

Browser and desktop builds use the same CSS pipeline:

```text
src/main.tsx
└── src/index.css
    ├── Tailwind CSS
    ├── Astra UI styles and semantic tokens
    └── styles/global.css
```

Because `styles/global.css` is imported last, team-level semantic token
overrides apply to both the browser and the pywebview desktop application.
There is no separate Python theme.

## Token customization

Put shared `@font-face` declarations and semantic custom-property overrides in
`styles/global.css`. Prefer overriding Astra's existing semantic properties so
components and token utilities update together:

```css
:root {
  --brand-primary: var(--team-action-primary);
  --brand-tertiary: var(--team-canvas);
  --surface-bg: var(--team-surface);
  --text-primary: var(--team-text-primary);
  --space-lg: var(--team-space-lg);
  --corner-lg: var(--team-radius-lg);
}
```

Dark-mode values can be scoped to `.dark` when they differ:

```css
.dark {
  --brand-tertiary: var(--team-dark-canvas);
  --surface-bg: var(--team-dark-surface);
  --text-primary: var(--team-dark-text-primary);
}
```

The React components use Astra utilities such as `bg-surface-bg`,
`text-text-primary`, `gap-lg`, and `rounded-corner-lg`. Do not replace these
with hardcoded colors, spacing, radii, or component-level inline styles.

## Fonts

All font files must be declared in `styles/global.css`, then assigned through
the typography variables used by Astra:

```css
@font-face {
  font-family: "Team Sans";
  src: url("/fonts/team-sans.woff2") format("woff2");
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
}

:root {
  --font-sans: "Team Sans";
  --font-display: "Team Sans";
}
```

Do not set font-family values in React components. If multiple faces are
needed, declare every face in CSS and map each role to a CSS variable.

Assets in Vite's `public/` directory are served from the application root.
When writing a relative URL from `styles/global.css`, verify it in both a
browser development session and a `pnpm desktop:build` bundle.

## Verifying changes

For browser development, CSS updates hot reload through Vite. For production
desktop use, rebuild and relaunch:

```bash
pnpm desktop:build
python desktop/main.py
```
