import { useEffect, useMemo, useState } from "react"
import {
  ThemeProvider,
  useTheme,
  SidebarNavigation,
  SidebarButton,
  SecondaryNav,
  SecondaryNavItem,
  Button,
  IconButton,
  SelectField,
  Badge,
  Tooltip,
} from "./astra"
import {
  LayoutGrid,
  RadioTower,
  Map,
  Clock,
  Settings,
  MapPin,
  RefreshCw,
  Wind,
  Droplets,
  Gauge,
  Eye,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudSun,
  Sun,
  Moon,
  Navigation,
  Sunrise,
  Sunset,
  Thermometer,
  Activity,
  Flame,
  Snowflake,
  CalendarDays,
  Pause,
  Play,
} from "lucide-react"
import {
  STATIONS,
  weatherApi,
  dailyRows,
  hourlyRows,
  describeWeatherCode,
  compassLabel,
  type Station,
  type Units,
  type WeatherApiResponse,
  type WeatherFamily,
} from "./openmeteo"
// Tunable copy + behavior lives in config.ts — edit quips / thresholds there.
import { QUIPS, classifyHeat } from "./config"

/* ----------------------------------------------------------------------------
 * Heat logic + easter eggs
 * (quips + thresholds now live in src/config.ts)
 * ------------------------------------------------------------------------- */

function toFahrenheit(temp: number, tempUnit: string): number {
  return tempUnit.includes("F") ? temp : (temp * 9) / 5 + 32
}

// Floating emoji overlay — kept intentionally sparse.
function EmojiField({ variant, count }: { variant: "ember" | "flake"; count: number }) {
  const safe = Math.min(count, 16)
  const items = useMemo(
    () =>
      Array.from({ length: safe }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        duration: 6 + Math.random() * 6,
        delay: Math.random() * 7,
        size: 16 + Math.random() * 18,
        emoji:
          variant === "ember"
            ? ["🔥", "🥵", "🔥"][Math.floor(Math.random() * 3)]
            : ["❄️", "🥶"][Math.floor(Math.random() * 2)],
      })),
    [variant, safe],
  )

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {items.map((it) => (
        <span
          key={it.id}
          className={variant === "ember" ? "tdh-ember" : "tdh-flake"}
          style={{
            left: `${it.left}%`,
            animationDuration: `${it.duration}s`,
            animationDelay: `${it.delay}s`,
            fontSize: `${it.size}px`,
          }}
        >
          {it.emoji}
        </span>
      ))}
    </div>
  )
}

/* ----------------------------------------------------------------------------
 * Small display helpers
 * ------------------------------------------------------------------------- */

function WeatherGlyph({
  family,
  isDay = true,
  className,
  strokeWidth = 1.5,
}: {
  family: WeatherFamily
  isDay?: boolean
  className?: string
  strokeWidth?: number
}) {
  const props = { className, strokeWidth }
  switch (family) {
    case "clear":
      return isDay ? <Sun {...props} /> : <Moon {...props} />
    case "partly":
      return isDay ? <CloudSun {...props} /> : <Cloud {...props} />
    case "cloudy":
      return <Cloud {...props} />
    case "fog":
      return <CloudFog {...props} />
    case "rain":
      return <CloudRain {...props} />
    case "snow":
      return <CloudSnow {...props} />
    case "storm":
      return <CloudLightning {...props} />
    default:
      return <Cloud {...props} />
  }
}

const round = (n: number) => Math.round(n)

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}
function formatHourShort(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric" })
}

// Compact instrument readout tile.
function MetricTile({
  icon,
  label,
  value,
  unit,
  detail,
}: {
  icon: React.ReactNode
  label: string
  value: string
  unit?: string
  detail?: string
}) {
  return (
    <div className="bg-surface-bg rounded-corner-md p-lg flex flex-col gap-xs">
      <div className="flex items-center gap-sm text-text-tertiary">
        {icon}
        <span className="text-video-title text-text-secondary uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-baseline gap-xs">
        <span className="text-heading text-text-primary tabular-nums">{value}</span>
        {unit ? <span className="text-video-title text-text-secondary">{unit}</span> : null}
      </div>
      {detail ? <span className="text-video-title text-text-tertiary">{detail}</span> : null}
    </div>
  )
}

/* ----------------------------------------------------------------------------
 * 7-day calendar panel (sits beside the hero)
 * ------------------------------------------------------------------------- */

function CalendarPanel({ data, tempUnit }: { data: WeatherApiResponse; tempUnit: string }) {
  const days = dailyRows(data)
  const hottest = Math.max(...days.map((d) => d.temperature_2m_max))
  return (
    <div className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg">
      <div className="flex items-center gap-md">
        <span className="text-text-tertiary">
          <CalendarDays size={16} strokeWidth={1.5} />
        </span>
        <span className="text-label text-text-primary">7-Day Forecast</span>
      </div>
      <div className="grid grid-cols-7 gap-xs flex-1">
        {days.map((d, i) => {
          const cond = describeWeatherCode(d.weather_code)
          const date = new Date(d.time)
          const isPeak = d.temperature_2m_max === hottest && toFahrenheit(hottest, tempUnit) >= 90
          return (
            <div
              key={d.time}
              className={`rounded-corner-md py-lg px-sm flex flex-col items-center gap-sm ${
                i === 0 ? "bg-brand-tertiary" : "bg-bg-faint"
              }`}
            >
              <span className="text-video-title text-text-secondary uppercase">
                {i === 0 ? "Now" : date.toLocaleDateString([], { weekday: "short" }).slice(0, 3)}
              </span>
              <span className="text-video-title text-text-tertiary tabular-nums">{date.getDate()}</span>
              <span className={isPeak ? "text-danger" : "text-text-secondary"}>
                {isPeak ? (
                  <Flame className="size-5" strokeWidth={1.5} />
                ) : (
                  <WeatherGlyph family={cond.family} className="size-5" strokeWidth={1.5} />
                )}
              </span>
              <span className="text-label-sm text-text-primary tabular-nums">{round(d.temperature_2m_max)}°</span>
              <span className="text-video-title text-text-tertiary tabular-nums">{round(d.temperature_2m_min)}°</span>
              <span className="flex items-center gap-xs text-video-title text-text-secondary">
                <Droplets size={10} />
                {d.precipitation_probability_max}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------------------
 * 24-hour outlook — now → end of today, with hourly numbered markers
 * ------------------------------------------------------------------------- */

function HourlyCurve({ data }: { data: WeatherApiResponse }) {
  const todayStr = data.current.time.slice(0, 10) // YYYY-MM-DD (station-local)
  const startHour = data.current.time.slice(0, 13) // YYYY-MM-DDTHH
  const pts = hourlyRows(data).filter(
    (p) => p.time.slice(0, 10) === todayStr && p.time.slice(0, 13) >= startHour,
  )

  const header = (
    <div className="flex items-center gap-md">
      <span className="text-text-tertiary">
        <Activity size={16} strokeWidth={1.5} />
      </span>
      <span className="text-label text-text-primary">Rest of Today</span>
      <span className="text-video-title text-text-tertiary">hourly · to 11:59 PM</span>
    </div>
  )

  if (pts.length < 2) {
    return (
      <div className="flex flex-col gap-lg">
        {header}
        <div className="bg-bg-faint rounded-corner-md p-xl text-center">
          <span className="text-label-sm text-text-secondary">
            That's a wrap on today — full hourly detail returns after midnight.
          </span>
        </div>
      </div>
    )
  }

  const temps = pts.map((p) => p.temperature_2m)
  const min = Math.min(...temps)
  const max = Math.max(...temps)
  const range = Math.max(1, max - min)

  const W = 1000
  const H = 200
  const padY = 44
  const px = (i: number) => (i / (pts.length - 1)) * 100
  const py = (t: number) => (padY + (1 - (t - min) / range) * (H - 2 * padY)) / H

  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${((i / (pts.length - 1)) * W).toFixed(1)},${(py(p.temperature_2m) * H).toFixed(1)}`)
    .join(" ")
  const area = `${line} L${W},${H} L0,${H} Z`

  return (
    <div className="flex flex-col gap-lg">
      {header}
      <div className="relative w-full h-48">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full text-brand-primary"
        >
          <defs>
            <linearGradient id="tdh-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.26" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#tdh-area)" />
          <path d={line} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Hourly numbered markers */}
        {pts.map((p, i) => (
          <div
            key={p.time}
            className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${px(i)}%`, top: `${py(p.temperature_2m) * 100}%` }}
          >
            <span className="text-video-title text-text-primary tabular-nums mb-xs">
              {round(p.temperature_2m)}°
            </span>
            <span
              className={`block size-2 rounded-corner-full ${i === 0 ? "bg-brand-primary ring-2 ring-brand-tertiary" : "bg-brand-primary"}`}
            />
          </div>
        ))}
      </div>

      {/* Hour axis */}
      <div className="relative w-full h-4">
        {pts.map((p, i) => (
          <span
            key={p.time}
            className="absolute -translate-x-1/2 text-video-title text-text-tertiary whitespace-nowrap"
            style={{ left: `${px(i)}%` }}
          >
            {i === 0 ? "Now" : formatHourShort(p.time)}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------------------
 * Console
 * ------------------------------------------------------------------------- */

function StationConsole() {
  const { theme, toggleTheme } = useTheme()
  const [stationId, setStationId] = useState<string>(STATIONS[0].id)
  const [units, setUnits] = useState<Units>("imperial")
  const [data, setData] = useState<WeatherApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null)
  const [brandTaps, setBrandTaps] = useState(0)
  const [forceHeat, setForceHeat] = useState(false)
  const [emberBoost, setEmberBoost] = useState(0)
  const [animationsOn, setAnimationsOn] = useState(true)

  const station: Station = STATIONS.find((s) => s.id === stationId) ?? STATIONS[0]

  async function load(s: Station, u: Units) {
    setLoading(true)
    setError(null)
    try {
      const response = await weatherApi(s, u)
      setData(response)
      setFetchedAt(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to reach the weather service")
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(station, units)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId, units])

  const current = data?.current
  const condition = current ? describeWeatherCode(current.weather_code) : null
  const tempUnit = data?.current_units.temperature_2m ?? "°"
  const windUnit = data?.current_units.wind_speed_10m ?? ""
  const isDay = current ? current.is_day === 1 : true

  const tempF = current ? toFahrenheit(current.temperature_2m, tempUnit) : 70
  const heat = classifyHeat(tempF, forceHeat)

  const quip = useMemo(() => {
    const pool = QUIPS[heat]
    return pool[Math.floor(Math.random() * pool.length)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heat, stationId, fetchedAt])

  function handleBrandTap() {
    const next = brandTaps + 1
    setBrandTaps(next)
    if (next >= 7) {
      setForceHeat(true)
      setAnimationsOn(true)
      setEmberBoost((n) => n + 4)
      setBrandTaps(0)
    }
  }

  const showEmbers = animationsOn && heat === "hellfire"
  const showFlakes = animationsOn && heat === "cold"

  return (
    <div className="flex h-screen">
      {showEmbers ? <EmojiField variant="ember" count={7 + emberBoost} /> : null}
      {showFlakes ? <EmojiField variant="flake" count={9} /> : null}

      <SidebarNavigation
        footer={
          <>
            {/* SidebarButton toggles theme — icon-rail control matches nav styling */}
            <Tooltip content={theme === "dark" ? "Light mode" : "Dark mode"} position="right">
              <SidebarButton
                icon={
                  theme === "dark" ? (
                    <Sun className="size-full" strokeWidth={1.5} />
                  ) : (
                    <Moon className="size-full" strokeWidth={1.5} />
                  )
                }
                onClick={toggleTheme}
              />
            </Tooltip>
            {/* No account / sign-in per product decision — footer holds settings only, no Avatar */}
            <SidebarButton icon={<Settings className="size-full" strokeWidth={1.5} />} />
          </>
        }
      >
        {/* Domain nav icons — generic Film/Book/Folder carry no meaning for a weather app */}
        <SidebarButton icon={<LayoutGrid className="size-full" strokeWidth={1.5} />} active />
        <SidebarButton icon={<RadioTower className="size-full" strokeWidth={1.5} />} />
        <SidebarButton icon={<Map className="size-full" strokeWidth={1.5} />} />
        <SidebarButton icon={<Clock className="size-full" strokeWidth={1.5} />} />
      </SidebarNavigation>

      <SecondaryNav title="Locations">
        {STATIONS.map((s) => (
          <SecondaryNavItem
            key={s.id}
            icon={<MapPin className="size-full" strokeWidth={1.5} />}
            label={s.name}
            active={s.id === stationId}
            onClick={() => setStationId(s.id)}
          />
        ))}
      </SecondaryNav>

      <main className="flex-1 bg-brand-tertiary p-2xl overflow-y-auto">
        {/* Brand eyebrow — tap 7× for a surprise */}
        <Button
          variant="ghost"
          size="small"
          onClick={handleBrandTap}
          className="mb-lg"
        >
          <span className="text-danger">
            <Flame size={18} strokeWidth={2} />
          </span>
          <span className="text-label text-text-primary uppercase tracking-widest">Too Damn Hot!</span>
        </Button>

        {/* Page header */}
        <div className="flex items-start justify-between gap-xl mb-xl flex-wrap">
          <div>
            <div className="flex items-center gap-md">
              <span className="text-title text-text-primary">{station.name}</span>
              <Badge
                label={loading ? "Syncing" : error ? "Offline" : "Live"}
                variant={loading ? "default" : error ? "danger" : "success"}
              />
            </div>
            <p className="text-label-sm text-text-secondary mt-xs">
              {station.region} · {station.latitude.toFixed(2)}°, {station.longitude.toFixed(2)}°
              {fetchedAt ? ` · Updated ${formatTime(fetchedAt.toISOString())}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-md">
            {heat === "hellfire" || heat === "cold" ? (
              <Button
                variant="neutral"
                size="small"
                iconStart={animationsOn ? <Pause size={16} /> : <Play size={16} />}
                onClick={() => setAnimationsOn((v) => !v)}
              >
                {animationsOn ? "Stop animation" : "Play animation"}
              </Button>
            ) : null}
            {/* kit omits a color on unselected options — text-text-primary cascades into them so they stay readable in dark mode */}
            <SelectField
              options={[
                { value: "imperial", label: "°F · mph" },
                { value: "metric", label: "°C · km/h" },
              ]}
              value={units}
              onChange={(v) => setUnits(v as Units)}
              className="w-40 text-text-primary"
            />
            <Tooltip content="Refresh readings" position="bottom">
              <IconButton
                icon={<RefreshCw size={16} className={loading ? "animate-spin" : ""} />}
                variant="primary"
                onClick={() => load(station, units)}
                disabled={loading}
              />
            </Tooltip>
          </div>
        </div>

        {error ? (
          <div className="bg-surface-bg rounded-corner-lg p-2xl flex flex-col items-center gap-lg text-center">
            <span className="text-danger">
              <CloudFog size={48} strokeWidth={1.5} />
            </span>
            <div className="flex flex-col gap-xs">
              <span className="text-label text-text-primary">Signal lost</span>
              <span className="text-label-sm text-text-secondary">{error}</span>
            </div>
            <Button variant="primary" iconStart={<RefreshCw size={16} />} onClick={() => load(station, units)}>
              Retry
            </Button>
          </div>
        ) : null}

        {!error && current && condition ? (
          <div className="flex flex-col gap-xl max-w-6xl">
            {/* Extreme-condition easter-egg banner */}
            {heat === "hellfire" ? (
              <div className="bg-surface-bg rounded-corner-lg p-xl flex items-center gap-xl">
                <span className={`text-danger ${animationsOn ? "tdh-wiggle" : ""}`}>
                  <Flame className="size-10" strokeWidth={1.75} />
                </span>
                <div className="flex flex-col gap-xs flex-1">
                  <span className="text-heading text-danger">
                    {forceHeat ? "You asked for it." : "IT'S TOO DAMN HOT."}
                  </span>
                  <span className="text-label-sm text-text-secondary">{quip}</span>
                </div>
                <Button
                  variant="neutral"
                  iconStart={<Flame size={16} />}
                  onClick={() => {
                    setAnimationsOn(true)
                    setEmberBoost((n) => n + 3)
                  }}
                >
                  Cope
                </Button>
              </div>
            ) : heat === "cold" ? (
              <div className="bg-surface-bg rounded-corner-lg p-xl flex items-center gap-xl">
                <span className={`text-brand-primary ${animationsOn ? "tdh-wiggle" : ""}`}>
                  <Snowflake className="size-10" strokeWidth={1.75} />
                </span>
                <div className="flex flex-col gap-xs flex-1">
                  <span className="text-heading text-text-primary">Not hot. Damn cold.</span>
                  <span className="text-label-sm text-text-secondary">{quip}</span>
                </div>
              </div>
            ) : null}

            {/* Top row: current conditions hero + 7-day calendar panel */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-xl">
              <div className="bg-surface-bg rounded-corner-lg p-2xl flex flex-col gap-xl">
                <div className="flex items-center gap-2xl">
                  <span
                    className={
                      heat === "hellfire"
                        ? "text-danger"
                        : isDay
                          ? "text-brand-primary"
                          : "text-text-secondary"
                    }
                  >
                    {heat === "hellfire" ? (
                      <Flame className={`size-20 ${animationsOn ? "tdh-wiggle" : ""}`} strokeWidth={1.25} />
                    ) : (
                      <WeatherGlyph
                        family={condition.family}
                        isDay={isDay}
                        className="size-20"
                        strokeWidth={1.25}
                      />
                    )}
                  </span>
                  <div className="flex flex-col gap-xs">
                    {/* Hero readout: Astra's type scale caps at 24px; the primary temperature needs to dominate */}
                    <div className="flex items-start gap-sm">
                      <span
                        className={`font-display tabular-nums text-hero ${
                          heat === "hellfire" ? `text-danger ${animationsOn ? "tdh-wiggle" : ""}` : "text-text-primary"
                        }`}
                      >
                        {round(current.temperature_2m)}
                      </span>
                      <span className="text-heading text-text-secondary mt-md">{tempUnit}</span>
                    </div>
                    <span className="text-heading text-text-primary">{condition.label}</span>
                    <span className="text-label-sm text-text-secondary">{quip}</span>
                  </div>
                </div>

                {/* Sunrise / sunset / feels-like chips */}
                <div className="flex flex-wrap gap-md">
                  <span className="bg-bg-faint rounded-corner-md px-lg py-sm flex items-center gap-sm text-label-sm text-text-secondary">
                    <Sunrise size={16} />
                    <span className="text-text-primary tabular-nums">
                      {data.daily?.sunrise?.[0] ? formatTime(data.daily.sunrise[0]) : "—"}
                    </span>
                  </span>
                  <span className="bg-bg-faint rounded-corner-md px-lg py-sm flex items-center gap-sm text-label-sm text-text-secondary">
                    <Sunset size={16} />
                    <span className="text-text-primary tabular-nums">
                      {data.daily?.sunset?.[0] ? formatTime(data.daily.sunset[0]) : "—"}
                    </span>
                  </span>
                  <span className="bg-bg-faint rounded-corner-md px-lg py-sm flex items-center gap-sm text-label-sm text-text-secondary">
                    <Thermometer size={16} />
                    Feels
                    <span className="text-text-primary tabular-nums">
                      {round(current.apparent_temperature)}
                      {tempUnit}
                    </span>
                  </span>
                </div>
              </div>

              <CalendarPanel data={data} tempUnit={tempUnit} />
            </div>

            {/* Compact instrument readouts */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-md">
              <MetricTile
                icon={<Wind size={14} strokeWidth={1.5} />}
                label="Wind"
                value={round(current.wind_speed_10m).toString()}
                unit={windUnit}
                detail={`${compassLabel(current.wind_direction_10m)} · ${round(current.wind_direction_10m)}°`}
              />
              <MetricTile
                icon={<Navigation size={14} strokeWidth={1.5} />}
                label="Gusts"
                value={round(current.wind_gusts_10m).toString()}
                unit={windUnit}
                detail="Peak 10-min"
              />
              <MetricTile
                icon={<Droplets size={14} strokeWidth={1.5} />}
                label="Humidity"
                value={round(current.relative_humidity_2m).toString()}
                unit="%"
                detail="Relative"
              />
              <MetricTile
                icon={<Gauge size={14} strokeWidth={1.5} />}
                label="Pressure"
                value={round(current.surface_pressure).toString()}
                unit="hPa"
                detail="Surface"
              />
              <MetricTile
                icon={<Cloud size={14} strokeWidth={1.5} />}
                label="Cloud"
                value={round(current.cloud_cover).toString()}
                unit="%"
                detail="Total sky"
              />
              <MetricTile
                icon={<Eye size={14} strokeWidth={1.5} />}
                label="Visibility"
                value={(current.visibility / 1000).toFixed(1)}
                unit="km"
                detail="Horizontal"
              />
              <MetricTile
                icon={<CloudRain size={14} strokeWidth={1.5} />}
                label="Precip"
                value={current.precipitation.toFixed(1)}
                unit="mm"
                detail="Last hour"
              />
              <MetricTile
                icon={<Activity size={14} strokeWidth={1.5} />}
                label="Apparent"
                value={round(current.apparent_temperature).toString()}
                unit={tempUnit}
                detail="Feels like"
              />
            </div>

            {/* Rest-of-today outlook */}
            <div className="bg-surface-bg rounded-corner-lg p-xl">
              <HourlyCurve data={data} />
            </div>
          </div>
        ) : null}

        {loading && !current && !error ? (
          <div className="bg-surface-bg rounded-corner-lg p-2xl flex items-center justify-center gap-md text-text-secondary">
            <RefreshCw size={20} className="animate-spin" />
            <span className="text-label-sm">Acquiring station telemetry…</span>
          </div>
        ) : null}
      </main>
    </div>
  )
}

// Force dark mode on first mount (station aesthetic) unless the user has chosen already.
function DarkModeDefault() {
  const { setTheme } = useTheme()
  useEffect(() => {
    if (!localStorage.getItem("astra-theme")) setTheme("dark")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

export default function App() {
  return (
    <ThemeProvider>
      <DarkModeDefault />
      <StationConsole />
    </ThemeProvider>
  )
}
