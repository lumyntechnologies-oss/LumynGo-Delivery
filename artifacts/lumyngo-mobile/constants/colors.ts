/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: "#0f172a",
    tint: "#3b82f6",
    background: "#0f172a",
    foreground: "#f8fafc",
    card: "#1e293b",
    cardForeground: "#f8fafc",
    primary: "#3b82f6",
    primaryForeground: "#ffffff",
    secondary: "#1e293b",
    secondaryForeground: "#94a3b8",
    muted: "#1e293b",
    mutedForeground: "#64748b",
    accent: "#3b82f6",
    accentForeground: "#ffffff",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "#334155",
    input: "#334155",
    success: "#22c55e",
    warning: "#f59e0b",
  },
  dark: {
    text: "#f8fafc",
    tint: "#3b82f6",
    background: "#0f172a",
    foreground: "#f8fafc",
    card: "#1e293b",
    cardForeground: "#f8fafc",
    primary: "#3b82f6",
    primaryForeground: "#ffffff",
    secondary: "#1e293b",
    secondaryForeground: "#94a3b8",
    muted: "#1e293b",
    mutedForeground: "#64748b",
    accent: "#3b82f6",
    accentForeground: "#ffffff",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "#334155",
    input: "#334155",
    success: "#22c55e",
    warning: "#f59e0b",
  },
  radius: 12,
};

export default colors;
