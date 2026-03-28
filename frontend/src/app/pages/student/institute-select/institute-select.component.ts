import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCard, MatCardContent, MatCardFooter, MatCardHeader } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel, MatError, MatHint } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { API_BASE_URL } from '../../core/api';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n.service';

interface Institute {
  id: number;
  name: string;
  district: string;
  city: string;
  code: string;
}

@Component({
  selector: 'app-institute-select',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatCardFooter,
    MatButton,
    MatIcon,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatProgressSpinner,
    MatError,
    MatHint
  ],
  template: `
    <div class="institute-select-container">
      <mat-card class="institute-card">
        <mat-card-header>
          <h1>{{ i18n.t('selectInstitute') }}</h1>
          <p class="subtitle">{{ i18n.t('instituteSelectionRequired') }}</p>
        </mat-card-header>

        <mat-card-content>
          <form (ngSubmit)="onSubmit()">
            <!-- Search Input -->
            <div class="search-section">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>{{ i18n.t('searchInstitute') }}</mat-label>
                <mat-icon matPrefix>business</mat-icon>
                <input 
                  type="text" 
                  matInput 
                  [(ngModel)]="searchText" 
                  name="search"
                  (keyup)="filterInstitutes()"
                  placeholder="Type institute name or code..."
                />
              </mat-form-field>
            </div>

            <!-- Institute Dropdown -->
            <div class="select-section">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>{{ i18n.t('institute') }}</mat-label>
                <mat-icon matPrefix>school</mat-icon>
                <mat-select [(ngModel)]="selectedInstituteId" name="institute" required>
                  <mat-select-trigger>
                    {{ getInstituteLabel(selectedInstituteId) }}
                  </mat-select-trigger>
                  <mat-optgroup *ngFor="let group of groupedInstitutes" [label]="group.district">
                    <mat-option 
                      *ngFor="let institute of group.institutes" 
                      [value]="institute.id"
                    >
                      <div class="institute-option">
                        <strong>{{ institute.name }}</strong>
                        <span class="code">{{ institute.code }}</span>
                      </div>
                    </mat-option>
                  </mat-optgroup>
                </mat-select>
                <mat-hint *ngIf="!selectedInstituteId">
                  {{ i18n.t('selectYourInstitute') }}
                </mat-hint>
                <mat-error *ngIf="!selectedInstituteId">
                  {{ i18n.t('instituteRequired') }}
                </mat-error>
              </mat-form-field>
            </div>

            <!-- Selected Institute Details -->
            <div class="institute-details" *ngIf="selectedInstitute">
              <div class="detail-card">
                <mat-icon>check_circle</mat-icon>
                <div class="detail-content">
                  <h3>{{ selectedInstitute.name }}</h3>
                  <p>{{ selectedInstitute.district }}, {{ selectedInstitute.city }}</p>
                  <p class="code">Code: {{ selectedInstitute.code }}</p>
                </div>
              </div>
            </div>

            <!-- No Results Message -->
            <div class="no-results" *ngIf="searchText && filteredInstitutes.length === 0">
              <mat-icon>search_off</mat-icon>
              <p>{{ i18n.t('noInstitutesFound') }}</p>
            </div>

            <!-- Submit Button -->
            <div class="button-section">
              <button 
                mat-raised-button 
                color="primary" 
                type="submit"
                [disabled]="!selectedInstituteId || isLoading"
                class="full-width"
              >
                <mat-icon *ngIf="!isLoading">arrow_forward</mat-icon>
                <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
                <span *ngIf="!isLoading">{{ i18n.t('continue') }}</span>
                <span *ngIf="isLoading">{{ i18n.t('processing') }}...</span>
              </button>

              <button 
                mat-stroked-button 
                type="button"
                (click)="onLogout()"
                class="full-width"
              >
                <mat-icon>logout</mat-icon>
                {{ i18n.t('logout') }}
              </button>
            </div>
          </form>
        </mat-card-content>

        <mat-card-footer class="info-footer">
          <div class="info-message">
            <mat-icon>info</mat-icon>
            <p>Your data is secure. We only use Google authentication to verify your identity.</p>
          </div>
        </mat-card-footer>
      </mat-card>

      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="isLoadingInstitutes">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading institutes...</p>
      </div>
    </div>
  `,
  styles: [`
    .institute-select-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .institute-card {
      width: 100%;
      max-width: 600px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.6s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    mat-card-header {
      text-align: center;
      margin-bottom: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem 1rem;
      border-radius: 12px 12px 0 0;
      margin: -16px -16px 2rem -16px;
    }

    mat-card-header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.8rem;
      font-weight: 700;
    }

    mat-card-header .subtitle {
      margin: 0;
      font-size: 0.95rem;
      opacity: 0.9;
    }

    mat-card-content {
      padding: 2rem;
    }

    .search-section,
    .select-section {
      margin-bottom: 2rem;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      display: block;
      margin-bottom: 0;
    }

    .institute-option {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem 0;
    }

    .institute-option strong {
      flex: 1;
    }

    .institute-option .code {
      font-size: 0.85rem;
      color: #666;
      background: #f5f5f5;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 500;
    }

    .institute-details {
      margin: 2rem 0;
      padding: 1.5rem;
      background: #f9f9f9;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .detail-card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .detail-card mat-icon {
      color: #4caf50;
      font-size: 28px;
      width: 28px;
      height: 28px;
      flex-shrink: 0;
      margin-top: 0.25rem;
    }

    .detail-content h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.2rem;
      color: #333;
    }

    .detail-content p {
      margin: 0.25rem 0;
      color: #666;
      font-size: 0.95rem;
    }

    .detail-content .code {
      font-weight: 500;
      color: #667eea;
    }

    .no-results {
      text-align: center;
      padding: 2rem;
      color: #999;
    }

    .no-results mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.5;
      margin-bottom: 1rem;
    }

    .button-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 2rem;
    }

    .button-section button {
      height: 48px;
      font-size: 1rem;
      font-weight: 500;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .button-section button:disabled {
      opacity: 0.5;
    }

    .info-footer {
      background: #f5f5f5;
      border-top: 1px solid #e0e0e0;
      padding: 1.5rem;
      border-radius: 0 0 12px 12px;
      margin: 2rem -16px -16px -16px;
    }

    .info-message {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      color: #666;
      font-size: 0.9rem;
    }

    .info-message mat-icon {
      color: #667eea;
      flex-shrink: 0;
      margin-top: 0.25rem;
    }

    .info-message p {
      margin: 0;
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      color: white;
      z-index: 1000;
    }

    @media (max-width: 600px) {
      .institute-select-container {
        padding: 10px;
      }

      mat-card-header {
        padding: 1.5rem 1rem;
      }

      mat-card-header h1 {
        font-size: 1.5rem;
      }

      mat-card-content {
        padding: 1.5rem;
      }
    }
  `]
})
export class InstituteSelectComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  protected i18n = inject(I18nService);

  institutes: Institute[] = [];
  filteredInstitutes: Institute[] = [];
  groupedInstitutes: Array<{ district: string; institutes: Institute[] }> = [];
  
  searchText = '';
  selectedInstituteId: number | null = null;
  isLoading = false;
  isLoadingInstitutes = true;

  ngOnInit() {
    // Check if user is authenticated
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth']);
      return;
    }

    // Load list of institutes
    this.loadInstitutes();
  }

  loadInstitutes() {
    this.isLoadingInstitutes = true;
    this.http.get<{ institutes: Institute[] }>(`${API_BASE_URL}/institutes`)
      .subscribe({
        next: (response) => {
          this.institutes = response.institutes || [];
          this.filteredInstitutes = [...this.institutes];
          this.groupByDistrict();
          this.isLoadingInstitutes = false;
        },
        error: (err) => {
          console.error('Failed to load institutes:', err);
          this.snackBar.open('Failed to load institutes. Please try again.', 'Close', { duration: 5000 });
          this.isLoadingInstitutes = false;
        }
      });
  }

  filterInstitutes() {
    if (!this.searchText.trim()) {
      this.filteredInstitutes = [...this.institutes];
    } else {
      const search = this.searchText.toLowerCase();
      this.filteredInstitutes = this.institutes.filter(inst =>
        inst.name.toLowerCase().includes(search) ||
        inst.code.toLowerCase().includes(search) ||
        inst.district.toLowerCase().includes(search) ||
        inst.city.toLowerCase().includes(search)
      );
    }
    this.groupByDistrict();
  }

  groupByDistrict() {
    const groups = new Map<string, Institute[]>();
    this.filteredInstitutes.forEach(inst => {
      if (!groups.has(inst.district)) {
        groups.set(inst.district, []);
      }
      groups.get(inst.district)!.push(inst);
    });

    this.groupedInstitutes = Array.from(groups.entries())
      .map(([district, institutes]) => ({
        district,
        institutes: institutes.sort((a, b) => a.name.localeCompare(b.name))
      }))
      .sort((a, b) => a.district.localeCompare(b.district));
  }

  get selectedInstitute(): Institute | undefined {
    return this.institutes.find(i => i.id === this.selectedInstituteId);
  }

  getInstituteLabel(id: number | null): string {
    if (!id) return '';
    const inst = this.institutes.find(i => i.id === id);
    return inst ? `${inst.name} (${inst.code})` : '';
  }

  onSubmit() {
    if (!this.selectedInstituteId) {
      this.snackBar.open('Please select an institute', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    // Save institute selection to backend
    this.http.post(`${API_BASE_URL}/students/select-institute`, {
      instituteId: this.selectedInstituteId
    }).subscribe({
      next: () => {
        this.snackBar.open('Institute selected successfully!', 'Close', { duration: 2000 });
        this.router.navigate(['/app/dashboard']);
      },
      error: (err) => {
        console.error('Failed to save institute selection:', err);
        this.isLoading = false;
        this.snackBar.open('Failed to save selection. Please try again.', 'Close', { duration: 5000 });
      }
    });
  }

  onLogout() {
    this.auth.logout();
    this.router.navigate(['/auth']);
  }
}
