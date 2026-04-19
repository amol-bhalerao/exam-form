import { Component, EventEmitter, Input, Output, signal, inject } from '@angular/core';
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
  @if (visible) {
    <div class="modern-modal-overlay" (click)="onClose()">
      <mat-card class="modern-modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h2 class="modal-title">Search Institutes</h2>
            <p class="modal-subtitle">Find and select an institute to create user accounts</p>
          </div>
          <button mat-icon-button aria-label="Close" (click)="onClose()" class="close-btn">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="search-container">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search by name, code, city, or contact</mat-label>
            <input matInput 
              [(ngModel)]="queryText" 
              (keyup.enter)="search()" 
              placeholder="Type to search..." 
              class="search-input" />
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="search()" [disabled]="loading()" class="search-btn">
            <mat-icon *ngIf="!loading()">search</mat-icon>
            <mat-icon *ngIf="loading()" class="spinner">hourglass_empty</mat-icon>
            {{ loading() ? 'Searching...' : 'Search' }}
          </button>
        </div>

        @if (error()) {
          <div class="error-message">
            <mat-icon>error</mat-icon>
            {{ error() }}
          </div>
        }

        @if (loading()) {
          <div class="loading-state">
            <div class="pulse-dot"></div>
            <p>Searching institutes...</p>
          </div>
        }

        @if (!loading() && results().length === 0 && queryText) {
          <div class="empty-state">
            <mat-icon>search_off</mat-icon>
            <p>No institutes found matching your search</p>
          </div>
        }

        @if (!loading() && !queryText && results().length === 0) {
          <div class="empty-state">
            <mat-icon>info</mat-icon>
            <p>Enter your search query above to find institutes</p>
          </div>
        }

        @if (results().length > 0) {
          <div class="results-container">
            <div class="results-count">Found {{ results().length }} institute(s)</div>
            <div class="results-grid">
              @for (inst of results(); track inst.id) {
                <div class="institute-card" (click)="select(inst)">
                  <div class="inst-header">
                    <h3>{{ inst.name }}</h3>
                    <span class="badge" [ngClass]="'badge-' + (inst.status || 'pending').toLowerCase()">
                      {{ inst.status || 'PENDING' }}
                    </span>
                  </div>
                  <div class="inst-details">
                    <div class="detail-row" *ngIf="inst.code">
                      <span class="label">Code:</span>
                      <span class="value">{{ inst.code }}</span>
                    </div>
                    <div class="detail-row" *ngIf="inst.collegeNo">
                      <span class="label">College No:</span>
                      <span class="value">{{ inst.collegeNo }}</span>
                    </div>
                    <div class="detail-row" *ngIf="inst.city || inst.district">
                      <span class="label">Location:</span>
                      <span class="value">{{ inst.city || inst.district }}</span>
                    </div>
                    <div class="detail-row" *ngIf="inst.contactPerson">
                      <span class="label">Contact:</span>
                      <span class="value">{{ inst.contactPerson }}</span>
                    </div>
                  </div>
                  <button mat-flat-button color="primary" class="select-btn" (click)="select(inst); $event.stopPropagation()">
                    <mat-icon>check_circle</mat-icon>
                    Select
                  </button>
                </div>
              }
            </div>
          </div>
        }
      </mat-card>
    </div>
  }
  `,
})
export class InstituteSearchModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() selected = new EventEmitter<any>();

  queryText = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly results = signal<any[]>([]);
  private allInstitutes: any[] = [];

  private readonly http = inject(HttpClient);

  search() {
    if (!this.queryText.trim()) {
      this.error.set('Please enter a search term');
      return;
    }

    this.error.set(null);
    this.loading.set(true);
    
    // Fetch all institutes and filter on the client side
    this.http.get<{ institutes: any[] }>(`${API_BASE_URL}/institutes/all`).subscribe({
      next: (res) => {
        this.allInstitutes = res.institutes || [];
        this.filterInstitutes();
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Could not load institutes. Please try again.');
        // Search error handled silently
        this.loading.set(false);
      }
    });
  }

  private filterInstitutes() {
    const query = this.queryText.toLowerCase().trim();
    const filtered = this.allInstitutes.filter((inst) => {
      const searchableFields = [
        inst.name || '',
        inst.code || '',
        inst.collegeNo || '',
        inst.udiseNo || '',
        inst.city || '',
        inst.district || '',
        inst.contactPerson || '',
        inst.contactEmail || ''
      ];
      return searchableFields.some(field => field.toLowerCase().includes(query));
    });
    this.results.set(filtered);
  }

  select(inst: any) {
    this.selected.emit(inst);
    this.visibleChange.emit(false);
  }

  onClose() {
    this.visibleChange.emit(false);
  }
}
