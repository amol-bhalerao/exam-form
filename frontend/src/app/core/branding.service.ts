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
    logoUrl: 'assets/images/hsc-exam-logo.svg',
    address: 'Developed by Hisoft IT Solutions | Pune, Maharashtra',
    addressMarathi: 'Hisoft IT Solutions द्वारे विकसित | पुणे, महाराष्ट्र',
    contactNumber: '',
    email: 'mail.hscinfo@gmail.com',
    website: 'https://hscexam.in/'
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
