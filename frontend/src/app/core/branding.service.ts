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
    boardName: 'Maharashtra State Board of Secondary and Higher Secondary Education',
    boardNameMarathi: 'महाराष्ट्र राज्य माध्यमिक व उच्च माध्यमिक शिक्षण मंडळ',
    boardNameShort: 'MSBSHSE',
    logoUrl: 'https://mahahsscboard.in/boardlogo.svg',
    address: 'Survey No. 832-A, Final Plot No. 178 and 179, Near Balachitra Vani, Behind Agarkar Research Institute, Bhanburda, Shivajiनagar, Pune-411004. Maharashtra (India)',
    addressMarathi: 'सर्व्हे क्रमांक ८३२-अ, फायनल प्लॉट क्रमांक १७८ आणि १७९, बालचित्रवाणीजवळ, आघारकर संशोधन संस्थेच्या मागे, भांबुर्डा, शिवाजीनगर, पुणे-४११००४. महाराष्ट्र (भारत)',
    contactNumber: '020-25705000',
    email: 'info@mahahsscboard.in',
    website: 'https://mahahsscboard.in/'
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
