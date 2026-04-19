import { Injectable } from '@angular/core';

export interface BrandingConfig {
  boardName: string;
  boardNameMarathi: string;
  boardNameShort: string;
  logoUrl: string;
  address: string;
  addressMarathi: string;
  contactNumber: string;
  email: string;
  website: string;
}

@Injectable({
  providedIn: 'root'
})
export class BrandingService {
  private branding: BrandingConfig = {
    boardName: 'HSC Exam Management System',
    boardNameMarathi: 'HSC परीक्षा व्यवस्थापन प्रणाली',
    boardNameShort: 'HEMS',
    logoUrl: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23003d7a%22/%3E%3Ctext x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2224%22 font-weight=%22bold%22 font-family=%22Arial%22%3EHEMS%3C/text%3E%3C/svg%3E',
    address: 'Developed by Hisoft IT Solutions | Pune, Maharashtra',
    addressMarathi: 'Hisoft IT Solutions द्वारे विकसित | पुणे, महाराष्ट्र',
    contactNumber: '',
    email: 'support@hisofttechnology.com',
    website: 'https://hisofttechnology.com/'
  };

  constructor() {}

  getBranding(): BrandingConfig {
    return this.branding;
  }

  getBoardName(lang: 'en' | 'mr' = 'en'): string {
    return lang === 'mr' ? this.branding.boardNameMarathi : this.branding.boardName;
  }

  getBoardNameShort(): string {
    return this.branding.boardNameShort;
  }

  getLogoUrl(): string {
    return this.branding.logoUrl;
  }

  getAddress(lang: 'en' | 'mr' = 'en'): string {
    return lang === 'mr' ? this.branding.addressMarathi : this.branding.address;
  }

  getContactNumber(): string {
    return this.branding.contactNumber;
  }

  getEmail(): string {
    return this.branding.email;
  }

  getWebsite(): string {
    return this.branding.website;
  }
}
