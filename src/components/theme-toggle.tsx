"use client";

import { useEffect, useSyncExternalStore, useState } from "react";

const THEME_KEY = "theme";

export function ThemeToggle() {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [dark, setDark] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem(THEME_KEY) === "dark",
  );

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (dark) {
      document.documentElement.setAttribute("data-theme", "dark");
      return;
    }

    document.documentElement.removeAttribute("data-theme");
  }, [dark, mounted]);

  function toggleTheme() {
    const next = !dark;
    window.localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    setDark(next);
  }

  if (!mounted) {
    return null;
  }

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      type="button"
    >
      {dark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
          <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
          <line x1="2" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="22" y2="12" />
          <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
          <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
