import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EnglishOnlyDirective } from './english-only.directive';

@Component({ standalone: true, imports: [EnglishOnlyDirective], template: '<input appEnglishOnly />' })
class HostComponent {}

describe('EnglishOnlyDirective', () => {
  let input: HTMLInputElement;

  beforeEach(() => {
    const fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(HostComponent);
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input');
  });

  const key = (k: string, init: KeyboardEventInit = {}) => {
    const e = new KeyboardEvent('keydown', { key: k, cancelable: true, ...init });
    input.dispatchEvent(e);
    return e.defaultPrevented;
  };

  const paste = (text: string) => {
    const dt = new DataTransfer();
    dt.setData('text', text);
    const e = new ClipboardEvent('paste', { clipboardData: dt, cancelable: true });
    input.dispatchEvent(e);
    return e.defaultPrevented;
  };

  it('allows Latin letters, digits and common punctuation', () => {
    for (const k of ['A', 'z', '7', ' ', '-', "'", '.', ',', '(']) expect(key(k)).withContext(k).toBeFalse();
  });

  it('blocks Devanagari and other scripts', () => {
    for (const k of ['अ', 'क', 'ह', 'é']) expect(key(k)).withContext(k).toBeTrue();
  });

  it('allows editing keys and shortcuts', () => {
    for (const k of ['Backspace', 'Delete', 'Tab', 'ArrowLeft']) expect(key(k)).toBeFalse();
    expect(key('v', { ctrlKey: true })).toBeFalse();
  });

  it('blocks pasting non-English text but allows English', () => {
    expect(paste('PATIL SURESH')).toBeFalse();
    expect(paste('पाटील')).toBeTrue();
  });
});
