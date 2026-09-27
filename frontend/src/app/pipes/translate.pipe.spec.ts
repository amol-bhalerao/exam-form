import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { TranslatePipe } from './translate.pipe';
import { I18nService } from '../core/i18n.service';

describe('TranslatePipe', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
  });

  it('follows the current language', () => {
    const i18n = TestBed.inject(I18nService);
    const pipe = TestBed.runInInjectionContext(() => new TranslatePipe());
    i18n.setLanguage('en', { persist: false });
    expect(pipe.transform('save')).toBe('Save');
    i18n.setLanguage('mr', { persist: false });
    expect(pipe.transform('save')).toBe('जतन करा');
  });
});
