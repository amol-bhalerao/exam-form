// Automatically detect API base URL based on environment
const getApiBaseUrl = (): string => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  // Production (Hostinger - same domain for both frontend and backend)
  if (hostname.includes('hsc-exam-form.hisofttechnology.com')) {
    return 'https://hsc-exam-form.hisofttechnology.com/api';
  }
  
  // Local development
  return 'http://localhost:3000/api';
};

export const API_BASE_URL = getApiBaseUrl();

