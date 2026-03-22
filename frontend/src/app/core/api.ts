// Automatically detect API base URL based on environment
const getApiBaseUrl = (): string => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  // Production (Hostinger - backend is on different subdomain)
  if (hostname.includes('hsc-exam-form.hisofttechnology.com')) {
    return 'https://exam.hisofttechnology.com/api';
  }

export const API_BASE_URL = getApiBaseUrl();

