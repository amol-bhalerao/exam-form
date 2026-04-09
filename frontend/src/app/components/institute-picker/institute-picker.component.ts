import { Component, EventEmitter, Input, Output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { API_BASE_URL } from '../../core/api';

export interface InstituteOption {
  id: number;
  name: string;
  code?: string;
  collegeNo?: string;
  udiseNo?: string;
}

@Component({
  selector: 'app-institute-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule],
  template: `
    <div class="picker-shell">
      <mat-form-field appearance="outline" class="full">
        <mat-label>Search institute</mat-label>
        <input matInput [value]="searchTerm()" (input)="onSearch($any($event.target).value)" placeholder="Type name, code, college no, or udise" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Select institute</mat-label>
        <mat-select [value]="selectedInstituteId" (selectionChange)="onSelect($event.value)" panelClass="institute-picker-panel">
          <mat-select-trigger>
            {{ selectedInstituteLabel() }}
          </mat-select-trigger>
          <mat-option *ngFor="let inst of filteredInstitutes()" [value]="inst.id">
            <div class="picker-option">
              <span class="picker-name">{{ inst.name }}</span>
              <span class="picker-meta">{{ inst.code || 'No code' }} • {{ inst.collegeNo || 'N/A' }} / {{ inst.udiseNo || 'N/A' }}</span>
            </div>
          </mat-option>
          <mat-option *ngIf="filteredInstitutes().length === 0" disabled>
            No matching institutes. Try approving or creating one in super admin.
          </mat-option>
        </mat-select>
      </mat-form-field>
    </div>
  `,
  styles: [`
    .full {
      width: 100%;
    }

    .picker-option {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
      padding-right: 0.4rem;
    }

    .picker-name {
      font-weight: 600;
      font-size: 0.93rem;
      color: #111827;
      white-space: normal;
      word-break: break-word;
      line-height: 1.3;
    }

    .picker-meta {
      font-size: 0.76rem;
      color: #64748b;
      white-space: normal;
      word-break: break-word;
      line-height: 1.3;
    }

    :host ::ng-deep .institute-picker-panel {
      max-width: min(680px, calc(100vw - 16px)) !important;
      max-height: min(70vh, 440px) !important;
      border-radius: 12px !important;
    }

    :host ::ng-deep .institute-picker-panel .mat-mdc-option {
      min-height: 72px !important;
      height: auto !important;
      padding-top: 0.55rem !important;
      padding-bottom: 0.55rem !important;
      align-items: flex-start !important;
    }

    :host ::ng-deep .institute-picker-panel .mdc-list-item__primary-text {
      white-space: normal !important;
      width: 100%;
      line-height: 1.3 !important;
    }

    @media (max-width: 480px) {
      .picker-name {
        font-size: 0.88rem;
      }

      .picker-meta {
        font-size: 0.72rem;
      }

      :host ::ng-deep .institute-picker-panel .mat-mdc-option {
        min-height: 82px !important;
      }
    }
  `]
})
export class InstitutePickerComponent implements OnInit {
  @Input() selectedInstituteId: number | null = null;
  @Output() selectedInstituteIdChange = new EventEmitter<number>();

  readonly institutes = signal<InstituteOption[]>([]);
  readonly filteredInstitutes = signal<InstituteOption[]>([]);
  readonly searchTerm = signal('');

  constructor(private readonly http: HttpClient) {}

  ngOnInit() {
    this.http.get<{ institutes: InstituteOption[] }>(`${API_BASE_URL}/institutes/list`).subscribe({
      next: (res) => {
        this.institutes.set(res.institutes ?? []);
        this.filteredInstitutes.set(res.institutes ?? []);
      },
      error: () => {
        this.institutes.set([]);
        this.filteredInstitutes.set([]);
      }
    });
  }

  onSearch(term: string) {
    this.searchTerm.set(term || '');
    const q = (term || '').trim().toLowerCase();
    const list = this.institutes();
    if (!q) {
      this.filteredInstitutes.set(list);
      return;
    }
    this.filteredInstitutes.set(
      list.filter((inst) =>
        inst.name.toLowerCase().includes(q) ||
        (inst.code ?? '').toLowerCase().includes(q) ||
        (inst.collegeNo ?? '').toLowerCase().includes(q) ||
        (inst.udiseNo ?? '').toLowerCase().includes(q)
      )
    );
  }

  selectedInstituteLabel() {
    const selected = this.institutes().find((inst) => inst.id === this.selectedInstituteId);
    return selected ? `${selected.name} (${selected.code || 'No code'})` : 'Select institute';
  }

  onSelect(id: number) {
    this.selectedInstituteId = id;
    this.selectedInstituteIdChange.emit(id);
  }
}
