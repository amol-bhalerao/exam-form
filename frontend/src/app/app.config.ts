import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';


import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { errorInterceptor } from './core/error.interceptor';
import { ThemeService } from './core/theme.service';
import { TableExportService } from './core/table-export.service';
import { I18nService } from './core/i18n.service';
import { GoogleAuthService } from './core/google-auth.service';
import { BrandingService } from './core/branding.service';
import { StudentProfileService } from './core/student-profile.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimations(),
    // Global services
    ThemeService,
    TableExportService,
    I18nService,
    GoogleAuthService,
    BrandingService,
    StudentProfileService
  ]
};
