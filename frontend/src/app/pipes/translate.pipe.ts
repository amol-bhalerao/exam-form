import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../core/i18n.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Make it impure to update when language changes
})
export class TranslatePipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(key: string): string {
    return this.i18n.translate(key as any);
  }
}
