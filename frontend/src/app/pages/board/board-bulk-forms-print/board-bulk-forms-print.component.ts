import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { StudentFormPrintComponent } from '../../student/student-form-print/student-form-print.component';

@Component({
  selector: 'app-board-bulk-forms-print',
  standalone: true,
  imports: [CommonModule, MatButtonModule, StudentFormPrintComponent],
  template: `
    <div class="no-print bulk-toolbar">
      <button mat-stroked-button type="button" (click)="goBack()">Back</button>
      <button mat-flat-button color="primary" type="button" (click)="printAll()">Print All Forms</button>
      <div class="meta">Total Forms: {{ applicationIds().length }}</div>
    </div>

    @if (applicationIds().length === 0) {
      <div class="empty">No forms found to print.</div>
    } @else {
      <div class="bulk-container" id="bulk-print-content">
        @for (id of applicationIds(); track id) {
          <div class="form-page">
            <app-student-form-print
              [applicationId]="id"
              [hideActionsInput]="true"
              [embeddedMode]="true">
            </app-student-form-print>
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        background: #ffffff;
      }

      .bulk-toolbar {
        position: sticky;
        top: 0;
        z-index: 20;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-bottom: 1px solid #cbd5e1;
        background: #f8fafc;
      }

      .meta {
        margin-left: auto;
        color: #334155;
        font-size: 0.85rem;
        font-weight: 600;
      }

      .bulk-container {
        width: 100%;
        max-width: 210mm;
        margin: 0 auto;
      }

      .form-page {
        break-after: page;
        page-break-after: always;
      }

      .form-page:last-child {
        break-after: auto;
        page-break-after: auto;
      }

      .empty {
        padding: 24px;
        color: #64748b;
      }

      @media print {
        .no-print {
          display: none !important;
        }

        :host,
        .bulk-container,
        .form-page {
          margin: 0;
          width: 100%;
          max-width: none;
        }
      }
    `
  ]
})
export class BoardBulkFormsPrintComponent implements OnInit {
  readonly applicationIds = signal<number[]>([]);

  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  ngOnInit() {
    const idsParam = this.route.snapshot.queryParamMap.get('ids') || '';
    const ids = idsParam
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value, index, arr) => Number.isInteger(value) && value > 0 && arr.indexOf(value) === index);

    this.applicationIds.set(ids);
  }

  goBack() {
    this.location.back();
  }

  printAll() {
    window.print();
  }
}
