import React, { createContext, useContext, useEffect, useState } from 'react';

export const THEMES = [
  {
    id: 'light-green',
    label: 'Light Green',
    accentColor: '#286b45',
    previewBg: '#eaf3e8',
    icon: '🌱',
    description: 'Fresh herbal & botanical mint theme',
  },
  {
    id: 'light-orange',
    label: 'Light Orange',
    accentColor: '#ea580c',
    previewBg: '#fff2e6',
    icon: '🍊',
    description: 'Warm appetizing citrus & terracotta theme',
  },
  {
    id: 'black',
    label: 'Black',
    accentColor: '#10b981',
    previewBg: '#121614',
    icon: '🌙',
    description: 'Ultra-sleek obsidian dark theme',
  },
];

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('food_recipe_theme');
      if (saved && (saved === 'light-green' || saved === 'black' || saved === 'light-orange')) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'light-green';
  });

  const setTheme = (newTheme) => {
    if (newTheme === 'light-green' || newTheme === 'black' || newTheme === 'light-orange') {
      setThemeState(newTheme);
      try {
        localStorage.setItem('food_recipe_theme', newTheme);
      } catch (err) {
        console.warn('Could not save theme to localStorage:', err);
      }
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
