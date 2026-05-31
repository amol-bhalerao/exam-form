import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatSnackBarModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'exam-form';

  @HostListener('input', ['$event'])
  uppercaseTextInputs(event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | null;
    if (!target || !this.shouldUppercaseInput(target)) return;

    const start = target.selectionStart;
    const end = target.selectionEnd;
    const upper = target.value.toUpperCase();
    if (upper === target.value) return;

    target.value = upper;
    target.dispatchEvent(new Event('input', { bubbles: true }));
    if (start !== null && end !== null) {
      target.setSelectionRange(start, end);
    }
  }

  private shouldUppercaseInput(target: HTMLInputElement | HTMLTextAreaElement) {
    const tag = target.tagName.toLowerCase();
    if (tag === 'textarea') return true;
    if (tag !== 'input') return false;

    const type = (target as HTMLInputElement).type?.toLowerCase() || 'text';
    const semanticName = [
      target.getAttribute('autocomplete'),
      target.getAttribute('formcontrolname'),
      target.getAttribute('name'),
      target.getAttribute('id'),
      target.getAttribute('aria-label')
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (/(user|username|email|mail|password)/.test(semanticName)) return false;
    return !['password', 'email', 'number', 'date', 'time', 'datetime-local', 'month', 'week', 'file', 'checkbox', 'radio'].includes(type);
  }
}
