import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { palettes, type Palette, type Scheme } from "./theme";

const STORAGE_KEY = "oma_theme";

interface ThemeValue {
  scheme: Scheme;
  color: Palette;
  /** True until the stored preference has been read, so nothing flashes. */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

/**
 * Light/dark switching for the whole app.
 *
 * The default follows the OS, which is what makes the app feel native on first
 * launch; an explicit choice overrides it and is remembered. Once chosen, the
 * preference stops tracking the system — someone who set the app to dark at
 * noon meant dark, not "dark until the phone changes its mind".
 *
 * Colours are read through this context rather than imported directly, because
 * React Native has no cascade: a palette captured at module scope cannot change
 * at runtime, so every screen has to re-render to repaint.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setScheme] = useState<Scheme>(() =>
    Appearance.getColorScheme() === "dark" ? "dark" : "light",
  );
  const [explicit, setExplicit] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // SecureStore is unavailable on web and can fail on a locked device; a
    // preference we cannot read is not worth failing a launch over.
    (async () => {
      try {
        if (Platform.OS === "web") return;
        const stored = await SecureStore.getItemAsync(STORAGE_KEY);
        if (cancelled || (stored !== "dark" && stored !== "light")) return;
        setScheme(stored);
        setExplicit(true);
      } catch {
        // Keep the OS default.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Follow the system only while the user has not chosen for themselves.
  useEffect(() => {
    if (explicit) return;
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setScheme(colorScheme === "dark" ? "dark" : "light");
    });
    return () => sub.remove();
  }, [explicit]);

  const toggle = useCallback(() => {
    setScheme((current) => {
      const next: Scheme = current === "dark" ? "light" : "dark";
      setExplicit(true);
      if (Platform.OS !== "web") {
        void SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {
          // A preference that fails to persist still applies for this session.
        });
      }
      return next;
    });
  }, []);

  const value = useMemo<ThemeValue>(
    () => ({ scheme, color: palettes[scheme], toggle }),
    [scheme, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside <ThemeProvider>");
  return value;
}

/** Shorthand for the common case: `const col = useColors();` then `col.ink`. */
export function useColors(): Palette {
  return useTheme().color;
}
