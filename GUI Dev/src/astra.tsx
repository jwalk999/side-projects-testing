import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react"

type Theme = "light" | "dark"

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("astra-theme")
    return saved === "light" || saved === "dark" ? saved : "dark"
  })

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    document.documentElement.style.colorScheme = theme
    localStorage.setItem("astra-theme", theme)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used inside ThemeProvider")
  return context
}

export function SidebarNavigation({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <aside className="bg-navigation-bg border-r border-border-subtle flex w-sidebar shrink-0 flex-col items-center py-lg">
      <nav className="flex flex-1 flex-col gap-sm">{children}</nav>
      <div className="flex flex-col gap-sm">{footer}</div>
    </aside>
  )
}

export function SidebarButton({
  icon,
  active = false,
  onClick,
}: {
  icon: ReactNode
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid size-control place-items-center rounded-corner-md transition-colors ${
        active
          ? "bg-brand-primary text-on-brand"
          : "text-text-tertiary hover:bg-bg-faint hover:text-text-primary"
      }`}
    >
      <span className="size-icon-md">{icon}</span>
    </button>
  )
}

export function SecondaryNav({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="bg-navigation-panel border-r border-border-subtle hidden w-secondary-nav shrink-0 flex-col p-lg md:flex">
      <span className="text-label text-text-primary px-sm py-md">{title}</span>
      <nav className="mt-md flex flex-col gap-xs">{children}</nav>
    </aside>
  )
}

export function SecondaryNavItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-md rounded-corner-md px-md py-sm text-left text-label-sm transition-colors ${
        active
          ? "bg-brand-tertiary text-brand-primary"
          : "text-text-secondary hover:bg-bg-faint hover:text-text-primary"
      }`}
    >
      <span className="size-icon-sm shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "neutral" | "ghost"
  size?: "small" | "medium"
  iconStart?: ReactNode
}

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "medium",
  iconStart,
  ...props
}: ButtonProps) {
  const variantClass = {
    primary: "bg-brand-primary text-on-brand hover:bg-brand-primary-hover",
    neutral: "bg-control-neutral text-text-primary hover:bg-control-neutral-hover",
    ghost: "bg-transparent text-text-primary hover:bg-bg-faint",
  }[variant]
  const sizeClass = size === "small" ? "min-h-control-sm px-md py-xs text-label-sm" : "min-h-control px-lg py-sm text-label"

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-sm rounded-corner-md transition-colors disabled:cursor-not-allowed disabled:opacity-disabled ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {iconStart ? <span className="size-icon-sm">{iconStart}</span> : null}
      {children}
    </button>
  )
}

export function IconButton({
  icon,
  variant = "primary",
  ...props
}: Omit<ButtonProps, "children" | "iconStart"> & { icon: ReactNode }) {
  return (
    <Button variant={variant} className="size-control p-0" {...props}>
      <span className="size-icon-sm">{icon}</span>
    </Button>
  )
}

export function SelectField({
  options,
  value,
  onChange,
  className = "",
}: {
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`min-h-control rounded-corner-md border border-border-default bg-control-neutral px-md text-label-sm text-text-primary outline-none focus:border-brand-primary ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export function Badge({
  label,
  variant = "default",
}: {
  label: string
  variant?: "default" | "danger" | "success"
}) {
  const variantClass = {
    default: "bg-bg-faint text-text-secondary",
    danger: "bg-danger-muted text-danger",
    success: "bg-success-muted text-success",
  }[variant]

  return <span className={`rounded-corner-full px-sm py-xs text-video-title ${variantClass}`}>{label}</span>
}

export function Tooltip({
  children,
  content,
}: {
  children: ReactNode
  content: string
  position?: "right" | "bottom"
}) {
  return <span title={content}>{children}</span>
}
