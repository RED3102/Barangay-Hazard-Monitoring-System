import { useState, useEffect } from "react";

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem("resident_theme") === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("resident_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("resident_theme", "light");
    }
  }, [isDark]);

  return [isDark, setIsDark];
}