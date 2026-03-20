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
        <mat-select [value]="selectedInstituteId" (selectionChange)="onSelect($event.value)">
          <mat-option *ngFor="let inst of filteredInstitutes()" [value]="inst.id">
            {{ inst.name }} ({{ inst.code || 'No code' }}) • {{ inst.collegeNo || 'N/A' }} / {{ inst.udiseNo || 'N/A' }}
          </mat-option>
          <mat-option *ngIf="filteredInstitutes().length === 0" disabled>
            No matching institutes. Try approving or creating one in super admin.
          </mat-option>
        </mat-select>
      </mat-form-field>
    </div>
  `,
  styles: [`
    .picker-shell { display: grid; gap: 8px; }
    .full { width: 100%; }
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

  onSelect(id: number) {
    this.selectedInstituteId = id;
    this.selectedInstituteIdChange.emit(id);
  }
}
