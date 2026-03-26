import { Injectable, signal } from '@angular/core';

export interface Theme {
  name: string;
  isDark: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    text: string;
    textSecondary: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

export const LIGHT_THEME: Theme = {
  name: 'light',
  isDark: false,
  colors: {
    primary: '#1d4ed8',
    secondary: '#7c3aed',
    accent: '#ec4899',
    background: '#f0f4ff',
    surface: '#ffffff',
    surfaceAlt: '#f8fafc',
    border: '#e2e8f0',
    text: '#0f172a',
    textSecondary: '#64748b',
    success: '#059669',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#0ea5e9'
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
    md: '0 4px 6px -1px rgba(15, 23, 42, 0.1)',
    lg: '0 20px 25px -5px rgba(15, 23, 42, 0.1)'
  }
};

export const DARK_THEME: Theme = {
  name: 'dark',
  isDark: true,
  colors: {
    primary: '#60a5fa',
    secondary: '#a78bfa',
    accent: '#f472b6',
    background: '#0f172a',
    surface: '#1e293b',
    surfaceAlt: '#334155',
    border: '#475569',
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4'
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
  }
};

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  currentTheme = signal<Theme>(LIGHT_THEME);
  isDarkMode = signal(false);

  constructor() {
    this.loadThemePreference();
  }

  private loadThemePreference() {
    const saved = localStorage.getItem('theme-preference');
    if (saved === 'dark') {
      this.setDarkMode(true);
    } else {
      this.setLightMode();
    }
  }

  setLightMode() {
    this.currentTheme.set(LIGHT_THEME);
    this.isDarkMode.set(false);
    this.applyTheme(LIGHT_THEME);
    localStorage.setItem('theme-preference', 'light');
  }

  setDarkMode(apply = true) {
    this.currentTheme.set(DARK_THEME);
    this.isDarkMode.set(true);
    if (apply) this.applyTheme(DARK_THEME);
    localStorage.setItem('theme-preference', 'dark');
  }

  toggleTheme() {
    if (this.isDarkMode()) {
      this.setLightMode();
    } else {
      this.setDarkMode();
    }
  }

  private applyTheme(theme: Theme) {
    const root = document.documentElement;
    const colors = theme.colors;

    // Apply CSS variables
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--bg', colors.background);
    root.style.setProperty('--panel', colors.surface);
    root.style.setProperty('--surface-alt', colors.surfaceAlt);
    root.style.setProperty('--border', colors.border);
    root.style.setProperty('--text', colors.text);
    root.style.setProperty('--text-secondary', colors.textSecondary);
    root.style.setProperty('--success', colors.success);
    root.style.setProperty('--warning', colors.warning);
    root.style.setProperty('--danger', colors.danger);
    root.style.setProperty('--info', colors.info);
    root.style.setProperty('--shadow-sm', theme.shadows.sm);
    root.style.setProperty('--shadow-md', theme.shadows.md);
    root.style.setProperty('--shadow-lg', theme.shadows.lg);

    // Apply body class
    document.body.classList.toggle('dark-mode', theme.isDark);
  }

  getColor(colorName: keyof Theme['colors']): string {
    return this.currentTheme().colors[colorName];
  }
}
