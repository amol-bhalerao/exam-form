import { Directive, HostListener } from '@angular/core';

/**
 * Directive to restrict input to English/Latin characters only
 * Prevents Devanagari and other language inputs
 * Usage: <input appEnglishOnly>
 */
@Directive({
  selector: '[appEnglishOnly]',
  standalone: true
})
export class EnglishOnlyDirective {
  
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const char = event.key;
    
    // Allow control keys (backspace, delete, tab, enter, etc.)
    if (this.isControlKey(event)) {
      return;
    }

    // Allow only ASCII characters (A-Z, a-z, 0-9, space, and common punctuation)
    // Regex matches: letters, digits, space, hyphen, apostrophe, period, comma
    const allowedPattern = /^[A-Za-z0-9\s\-'.,()\[\]]$/;
    
    if (!allowedPattern.test(char)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') || '';
    
    // Allow only ASCII characters
    const allowedPattern = /^[A-Za-z0-9\s\-'.,()\[\]]*$/;
    
    if (!allowedPattern.test(pastedText)) {
      event.preventDefault();
    }
  }

  private isControlKey(event: KeyboardEvent): boolean {
    return (
      event.key === 'Backspace' ||
      event.key === 'Delete' ||
      event.key === 'Tab' ||
      event.key === 'Enter' ||
      event.key === 'Escape' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === 'ArrowUp' ||
      event.key === 'ArrowDown' ||
      event.key === 'Home' ||
      event.key === 'End' ||
      (event.ctrlKey && (
        event.key === 'a' || 
        event.key === 'c' || 
        event.key === 'x' || 
        event.key === 'v' ||
        event.key === 'z' ||
        event.key === 'y'
      )) ||
      (event.metaKey && (
        event.key === 'a' || 
        event.key === 'c' || 
        event.key === 'x' || 
        event.key === 'v' ||
        event.key === 'z'
      ))
    );
  }
}
