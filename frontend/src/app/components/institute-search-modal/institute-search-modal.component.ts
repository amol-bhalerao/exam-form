import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { API_BASE_URL } from '../../core/api';

@Component({
  selector: 'app-institute-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatDividerModule],
  template: `
    <div *ngIf="visible" class="picker-overlay">
      <mat-card class="picker-card">
        <div class="header-row">
          <div>
            <div class="title">Search colleges</div>
            <div class="subtitle">Search by name, code, city, or contact person and select one.</div>
          </div>
          <button mat-icon-button color="primary" type="button" aria-label="Close" (click)="onClose()"><mat-icon>close</mat-icon></button>
        </div>

        <div class="search-row">
          <mat-form-field appearance="outline" class="full">
            <mat-label>Search institutes</mat-label>
            <input matInput [value]="query()" (input)="query.set($any($event.target).value)" placeholder="Name, code, city, contact" />
          </mat-form-field>
          <button mat-flat-button color="primary" type="button" (click)="search()">Search</button>
        </div>

        <div *ngIf="error()" class="error">{{ error() }}</div>
        <div *ngIf="loading()" class="muted">Searching…</div>
        <div *ngIf="!loading() && results().length === 0" class="muted">No institutes found yet.</div>

        <div class="table-wrapper" *ngIf="results().length > 0">
          <table class="inst-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>City</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let inst of results()">
                <td>{{ inst.name }}</td>
                <td>{{ inst.code || 'N/A' }}</td>
                <td>{{ inst.city || inst.district || '-' }}</td>
                <td>{{ inst.status || '-' }}</td>
                <td><button mat-stroked-button color="primary" type="button" (click)="select(inst)">Select</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .picker-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.42);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      z-index: 9999;
      padding: 10px;
    }
    .picker-card {
      width: min(920px, calc(100% - 140px));
      max-height: 88vh;
      overflow: auto;
      padding: 12px;
      margin-right: 10px;
    }
    .header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .title { font-weight: 700; font-size: 1.15rem; }
    .subtitle { color: #4b5563; font-size: .9rem; }
    .search-row { margin-top: 6px; display: flex; gap: 8px; align-items: center; }
    .full { width: 100%; }
    .error { color: #b91c1c; margin: 6px 0; }
    .muted { color: #6b7280; margin: 6px 0; }
    .table-wrapper { overflow: auto; margin-top: 10px; }
    .inst-table { width: 100%; border-collapse: collapse; font-size: .95rem; }
    .inst-table th, .inst-table td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
    .inst-table th { background: #f9fafb; font-weight: 700; }
  `]
})
export class InstituteSearchModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() selected = new EventEmitter<any>();

  readonly query = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly results = signal<any[]>([]);

  constructor(private readonly http: HttpClient) {}

  onClose() {
    this.visibleChange.emit(false);
  }

  search() {
    this.error.set(null);
    this.loading.set(true);
    const q = this.query().trim();
    this.http.get<{ institutes: any[] }>(`${API_BASE_URL}/institutes/search`, { params: { query: q } }).subscribe({
      next: (res) => {
        this.results.set(res.institutes || []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not search institutes');
        this.loading.set(false);
      }
    });
  }

  select(inst: any) {
    this.selected.emit(inst);
    this.visibleChange.emit(false);
  }
}
