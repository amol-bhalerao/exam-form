import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { LanguageSwitcherComponent } from './language-switcher.component';
import { I18nService } from '../../core/i18n.service';

describe('LanguageSwitcherComponent', () => {
  let fixture: ComponentFixture<LanguageSwitcherComponent>;
  let i18n: I18nService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [LanguageSwitcherComponent], providers: [provideHttpClient()] });
    i18n = TestBed.inject(I18nService);
    fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  const buttons = () => Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];

  it('offers Marathi, English and Hindi as a radio group', () => {
    expect(buttons().map((b) => b.textContent!.trim())).toEqual(['मराठी', 'English', 'हिंदी']);
    expect(fixture.nativeElement.querySelector('[role="radiogroup"]')).toBeTruthy();
  });

  it('marks the current language as checked', () => {
    const active = buttons().find((b) => b.getAttribute('aria-checked') === 'true')!;
    expect(active.textContent!.trim()).toBe('मराठी');
  });

  it('switches language on click', () => {
    buttons()[2].click();
    fixture.detectChanges();
    expect(i18n.getLanguage()).toBe('hi');
    expect(buttons()[2].classList).toContain('active');
  });

  it('shows short labels in compact mode', () => {
    fixture.componentInstance.compact = true;
    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();
    expect(buttons().map((b) => b.textContent!.trim())).toEqual(['मरा', 'EN', 'हिं']);
  });
});
