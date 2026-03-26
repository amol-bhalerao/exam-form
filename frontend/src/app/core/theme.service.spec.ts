import { TestBed } from '@angular/core/testing';
import { ThemeService, LIGHT_THEME, DARK_THEME } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with light theme by default', () => {
    expect(service.currentTheme().name).toBe('light');
    expect(service.isDarkMode()).toBe(false);
  });

  it('should set light theme', () => {
    service.setDarkMode();
    service.setLightMode();
    expect(service.currentTheme().name).toBe('light');
    expect(service.isDarkMode()).toBe(false);
    expect(localStorage.getItem('theme-preference')).toBe('light');
  });

  it('should set dark theme', () => {
    service.setDarkMode();
    expect(service.currentTheme().name).toBe('dark');
    expect(service.isDarkMode()).toBe(true);
    expect(localStorage.getItem('theme-preference')).toBe('dark');
  });

  it('should toggle between themes', () => {
    service.setLightMode();
    service.toggleTheme();
    expect(service.isDarkMode()).toBe(true);
    service.toggleTheme();
    expect(service.isDarkMode()).toBe(false);
  });

  it('should load theme preference from localStorage', () => {
    localStorage.setItem('theme-preference', 'dark');
    // Create new service instance
    const newService = new ThemeService();
    expect(newService.isDarkMode()).toBe(true);
  });

  it('should get color from current theme', () => {
    service.setLightMode();
    const primaryColor = service.getColor('primary');
    expect(primaryColor).toBe(LIGHT_THEME.colors.primary);
  });

  it('should have required theme colors', () => {
    const requiredColors = ['primary', 'secondary', 'accent', 'background', 'text', 'success', 'warning', 'danger'];
    requiredColors.forEach(color => {
      expect((LIGHT_THEME.colors as any)[color]).toBeDefined();
      expect((DARK_THEME.colors as any)[color]).toBeDefined();
    });
  });

  it('should have required theme shadows', () => {
    const requiredShadows = ['sm', 'md', 'lg'];
    requiredShadows.forEach(shadow => {
      expect((LIGHT_THEME.shadows as any)[shadow]).toBeDefined();
      expect((DARK_THEME.shadows as any)[shadow]).toBeDefined();
    });
  });
});
