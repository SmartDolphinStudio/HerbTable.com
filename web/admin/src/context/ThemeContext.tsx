import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  bgColor: string;
  setBgColor: (color: string) => void;
  bgImage: string;
  setBgImage: (url: string) => void;
  opacity: number;
  setOpacity: (opacity: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const defaultColors: Record<string, string> = {
  slate: '#1e293b',
  blue: '#1e3a5f',
  green: '#1a3a2a',
  purple: '#2d1b4e',
  red: '#3b1a1a',
  amber: '#3b2f1a',
  cyan: '#1a3a3b',
  pink: '#3b1a2f',
  indigo: '#1e1b4b',
  teal: '#134e4a',
  orange: '#431407',
  rose: '#4c0519',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'slate');
  const [bgColor, setBgColorState] = useState(() => localStorage.getItem('bgColor') || defaultColors.slate);
  const [bgImage, setBgImageState] = useState(() => localStorage.getItem('bgImage') || '');
  const [opacity, setOpacityState] = useState(() => Number(localStorage.getItem('opacity')) || 0.85);

  const setTheme = (t: string) => {
    setThemeState(t);
    localStorage.setItem('theme', t);
    if (defaultColors[t]) {
      setBgColorState(defaultColors[t]);
      localStorage.setItem('bgColor', defaultColors[t]);
    }
  };

  const setBgColor = (c: string) => {
    setBgColorState(c);
    localStorage.setItem('bgColor', c);
  };

  const setBgImage = (url: string) => {
    setBgImageState(url);
    localStorage.setItem('bgImage', url);
  };

  const setOpacity = (o: number) => {
    setOpacityState(o);
    localStorage.setItem('opacity', String(o));
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--bg-color', bgColor);
    document.documentElement.style.setProperty('--bg-opacity', String(opacity));
  }, [bgColor, opacity]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, bgColor, setBgColor, bgImage, setBgImage, opacity, setOpacity }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
