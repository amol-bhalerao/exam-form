export const environment = {
  production: true,

  // ═════════════════════════════════════════════════════════════════════════
  // PRODUCTION API Configuration
  // ═════════════════════════════════════════════════════════════════════════
  
  apiUrl: 'https://hsc-exam-form.hisofttechnology.com/api',
  apiBaseUrl: 'https://hsc-exam-form.hisofttechnology.com/api',
  apiTimeout: 30000, // 30 seconds

  // ═════════════════════════════════════════════════════════════════════════
  // Google OAuth Configuration
  // ═════════════════════════════════════════════════════════════════════════
  
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  googleScope: 'profile email',

  // ═════════════════════════════════════════════════════════════════════════
  // Application Configuration
  // ═════════════════════════════════════════════════════════════════════════
  
  appName: 'HSC Exam Portal',
  appVersion: '1.0.0',

  // ═════════════════════════════════════════════════════════════════════════
  // Feature Flags
  // ═════════════════════════════════════════════════════════════════════════
  
  enableAnalytics: true,
  enableErrorReporting: true,
  enableUserTracking: false,
  enablePayments: true,

  // ═════════════════════════════════════════════════════════════════════════
  // Logging & Debugging
  // ═════════════════════════════════════════════════════════════════════════
  
  logLevel: 'warn', // error, warn, info, debug
  enableConsoleLogging: false,
  enableDetailedErrorMessages: false,

  // ═════════════════════════════════════════════════════════════════════════
  // Performance Settings
  // ═════════════════════════════════════════════════════════════════════════
  
  enableCaching: true,
  cacheExpirationMinutes: 60,
  enableLazyLoading: true,

  // ═════════════════════════════════════════════════════════════════════════
  // Payment Gateway Configuration
  // ═════════════════════════════════════════════════════════════════════════
  
  paymentProvider: 'cashfree',
  cashfreeEnvironment: 'PROD',

  // ═════════════════════════════════════════════════════════════════════════
  // UI Configuration
  // ═════════════════════════════════════════════════════════════════════════
  
  theme: 'light',
  locale: 'en-IN',
  dateFormat: 'DD/MM/YYYY',
  currency: 'INR',

  // ═════════════════════════════════════════════════════════════════════════
  // Session Management
  // ═════════════════════════════════════════════════════════════════════════
  
  sessionTimeout: 24 * 60, // 24 hours in minutes
  warningBeforeLogout: 5, // minutes

  // ═════════════════════════════════════════════════════════════════════════
  // Authentication Routes
  // ═════════════════════════════════════════════════════════════════════════
  
  loginRedirectUrl: '/app/dashboard',
  logoutRedirectUrl: '/',
  unauthorizedRedirectUrl: '/login',
  forbiddenRedirectUrl: '/unauthorized',

  // ═════════════════════════════════════════════════════════════════════════
  // File Upload Configuration
  // ═════════════════════════════════════════════════════════════════════════
  
  maxFileSizeBytes: 5242880, // 5MB
  allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'],

  // ═════════════════════════════════════════════════════════════════════════
  // Hostinger Deployment Configuration
  // ═════════════════════════════════════════════════════════════════════════
  
  deploymentTarget: 'hostinger',
  deploymentEnvironment: 'production',
  enableAutoUpdate: true,
};