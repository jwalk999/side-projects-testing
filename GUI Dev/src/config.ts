/* ============================================================================
 * "Too Damn Hot!" — CONFIGURATION & INTEGRATION GUIDE
 * ============================================================================
 *
 * This file is the single place to tune the app's behavior and copy. Editing
 * the values here changes the UI without touching component code. It also
 * documents where everything lives so you can drop this weather console into
 * an existing program.
 *
 * ----------------------------------------------------------------------------
 * FILE MAP — what lives where
 * ----------------------------------------------------------------------------
 *   src/config.ts      ← YOU ARE HERE. Quips, heat thresholds, station list
 *                         pointer, and integration notes.
 *   src/openmeteo.ts   ← Data layer. Talks to the Open-Meteo API. Field names
 *                         mirror the `openmeteo-requests` Python SDK exactly
 *                         (temperature_2m, wind_speed_10m, is_day, …).
 *   src/App.tsx        ← All UI. Reads config values from this file and
 *                         renders with Astra kit components + design tokens.
 *   styles/global.css  ← Astra design-system tokens (colors, spacing, radius,
 *                         typography). Change styling HERE, not in components.
 *   src/index.css      ← Tailwind entrypoint + easter-egg keyframes.
 *   src/astra.tsx      ← Local Astra component primitives and theme provider.
 *
 * ----------------------------------------------------------------------------
 * HOW TO DROP THIS INTO AN EXISTING APP
 * ----------------------------------------------------------------------------
 * 1. Copy `src/openmeteo.ts`, `src/config.ts`, and the pieces of `src/App.tsx`
 *    you want (the whole `StationConsole` component is the console UI).
 * 2. The root must be wrapped in the local <ThemeProvider> (see the bottom of
 *    App.tsx) so design tokens + dark mode work.
 * 3. Make sure `src/index.css` (or your global stylesheet) imports:
 *        @import "tailwindcss";
 *        @import "../styles/global.css";
 *    plus the .tdh-* keyframes if you keep the emoji easter eggs.
 * 4. Copy `src/astra.tsx` and ensure `lucide-react` is installed.
 *
 * ----------------------------------------------------------------------------
 * COMMON EDITS — cookbook
 * ----------------------------------------------------------------------------
 * • Change a quip / add a joke ............ edit QUIPS below.
 * • Change when it screams "TOO DAMN HOT" . edit HEAT_THRESHOLDS below.
 * • Add / remove a location ............... edit STATIONS in src/openmeteo.ts.
 * • Add a new weather metric tile ......... in src/App.tsx, add a <MetricTile>
 *        inside the "Compact instrument readouts" grid, reading a field off
 *        `current` (e.g. current.wind_gusts_10m). If the field isn't fetched
 *        yet, add its native Open-Meteo name to CURRENT_VARIABLES in
 *        src/openmeteo.ts (order matters for the Python SDK) and to the
 *        CurrentWeather type.
 * • Change colors / fonts / spacing ....... edit the design tokens in
 *        styles/global.css. Never hardcode hex in components — use token classes
 *        (text-text-primary, bg-surface-bg, gap-lg, rounded-corner-lg, …).
 * • Turn the floating emoji off by default  set the initial `animationsOn`
 *        state to false in StationConsole (src/App.tsx).
 * ========================================================================== */

/* ----------------------------------------------------------------------------
 * HEAT STATE
 * ----------------------------------------------------------------------------
 * The app buckets the current "feels-like-in-Fahrenheit" reading into one of
 * these states. Each state drives the quips, the hero glyph, and the easter
 * eggs (embers at "hellfire", snowflakes at "cold").
 */
export type HeatState = "hellfire" | "hot" | "pleasant" | "chilly" | "cold"

/* Thresholds are in DEGREES FAHRENHEIT (the app converts internally, so these
 * stay in °F even when the user is viewing °C). Evaluated top-down:
 *   >= hellfire  → "hellfire"   (embers + "IT'S TOO DAMN HOT" banner)
 *   >= hot       → "hot"
 *   <= cold      → "cold"       (snowflakes + "damn cold" banner)
 *   <= chilly    → "chilly"
 *   otherwise    → "pleasant"
 * Widen the pleasant band by lowering `hot` / raising `chilly`, etc. */
export const HEAT_THRESHOLDS = {
  hellfire: 100,
  hot: 90,
  chilly: 50,
  cold: 32,
} as const

/* Pure classifier used by App.tsx. `forced` is the 7-tap easter egg that pins
 * the app to "hellfire" no matter the real temperature. */
export function classifyHeat(tempF: number, forced: boolean): HeatState {
  if (forced) return "hellfire"
  if (tempF >= HEAT_THRESHOLDS.hellfire) return "hellfire"
  if (tempF >= HEAT_THRESHOLDS.hot) return "hot"
  if (tempF <= HEAT_THRESHOLDS.cold) return "cold"
  if (tempF <= HEAT_THRESHOLDS.chilly) return "chilly"
  return "pleasant"
}

/* ----------------------------------------------------------------------------
 * QUIPS  ← every line the app can spit out lives here
 * ----------------------------------------------------------------------------
 * One array per heat state. On each load / refresh / location change the app
 * picks one at random from the matching state's list. Add, remove, or reword
 * freely — empty arrays are not recommended (the app expects at least one).
 */
export const QUIPS: Record<HeatState, string[]> = {
  hellfire: [
    "It's too damn hot.",
    "Satan called — he wants his thermostat back.",
    "You could fry an egg on the sidewalk right now.",
    "Consider your options for becoming a puddle.",
    "This is fine. Everything is fine. 🔥",
  ],
  hot: [
    "Scorcher alert. Hydrate or diedrate.",
    "Shade is your best friend today.",
    "Warm enough to question your life choices.",
  ],
  pleasant: [
    "Chef's kiss weather. Go outside.",
    "Not too damn anything. Genuinely nice.",
    "The rare day the app name doesn't apply.",
  ],
  chilly: ["Bring a jacket, champ.", "Sweater weather has entered the chat."],
  cold: [
    "Too damn cold, actually.",
    "Absolutely frigid. Layers upon layers.",
    "Your nose is going to run. Prepare accordingly.",
  ],
}

/* ----------------------------------------------------------------------------
 * EASTER EGGS — quick reference (behavior lives in src/App.tsx)
 * ----------------------------------------------------------------------------
 * • 7 taps on the "Too Damn Hot!" eyebrow  → force "hellfire" mode.
 * • "Cope" button                          → adds more floating embers.
 * • Emoji overlay is capped at 16 on screen (EmojiField) to stay tasteful.
 * • Pause/Play button appears in hellfire/cold to stop the animation.
 * Tune the emoji pools in the EmojiField component in src/App.tsx.
 */

/* Re-export so newcomers can discover the location list and the exact
 * Open-Meteo variables requested without hunting through openmeteo.ts. */
export {
  STATIONS,
  CURRENT_VARIABLES,
  HOURLY_VARIABLES,
  DAILY_VARIABLES,
} from "./openmeteo"
