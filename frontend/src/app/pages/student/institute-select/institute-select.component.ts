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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { API_BASE_URL } from '../../../core/api';
import { AuthService } from '../../../core/auth.service';
import { I18nService } from '../../../core/i18n.service';

interface Institute {
  id: number;
  name: string;
  district: string;
  city: string;
  code: string;
}

interface Stream {
  id: number;
  name: string;
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
    MatHint,
    MatDialogModule
  ],
  template: `
    <div class="institute-select-container">
      <mat-card class="institute-card">
        <mat-card-header>
          <h1>Select Your Institute & Stream</h1>
          <p class="subtitle">⚠️ This selection cannot be changed later</p>
        </mat-card-header>

        <!-- ⚠️ IMPORTANT WARNING - ENGLISH -->
        <div class="warning-banner warning-english">
          <mat-icon>warning</mat-icon>
          <div>
            <strong>⚠️ IMPORTANT NOTICE</strong>
            <p>The Institute and Stream you select here <strong>CANNOT be changed later</strong>. This information will be used to fill your exam forms. Please select carefully.</p>
          </div>
        </div>

        <!-- ⚠️ महत्वाचे सूचना - MARATHI -->
        <div class="warning-banner warning-marathi">
          <mat-icon>warning</mat-icon>
          <div>
            <strong>⚠️ महत्वाचे सूचना</strong>
            <p>येथे आपण निवडलेले संस्था आणि प्रवाह <strong>नंतर बदलले जाऊ शकत नाही</strong>. हे माहिती आपल्या परीक्षा फॉर्म भरण्यासाठी वापरली जाईल. कृपया काळजीसह निवड करा.</p>
          </div>
        </div>

        <mat-card-content>
          <form (ngSubmit)="onSubmit()">
            <!-- Institute Selection -->
            <div class="select-section">
              <h2>Step One: Select Your Institute</h2>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Search Institute</mat-label>
                <mat-icon matPrefix>business</mat-icon>
                <input 
                  type="text" 
                  matInput 
                  [(ngModel)]="searchText" 
                  name="search"
                  (keyup)="filterInstitutes()"
                  placeholder="Search by name or code..."
                />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>{{ i18n.t('institute') }}</mat-label>
                <mat-icon matPrefix>school</mat-icon>
                <mat-select [(ngModel)]="selectedInstituteId" name="institute" required (selectionChange)="onInstituteSelected()">
                  <mat-select-trigger *ngIf="selectedInstituteId">
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
                <mat-error *ngIf="!selectedInstituteId">
                  {{ i18n.t('instituteRequired') }}
                </mat-error>
              </mat-form-field>

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
            </div>

            <!-- Stream Selection -->
            <div class="select-section" *ngIf="selectedInstituteId">
              <h2>Step Two: Select Your Stream</h2>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Stream</mat-label>
                <mat-icon matPrefix>layers</mat-icon>
                <mat-select [(ngModel)]="selectedStream" name="stream" required>
                  <mat-select-trigger *ngIf="selectedStream">
                    {{ selectedStream }}
                  </mat-select-trigger>
                  <mat-option *ngFor="let stream of streams" [value]="stream.name">
                    {{ stream.name }}
                  </mat-option>
                </mat-select>
                <mat-hint>
                  Your stream will determine which subjects you can take
                </mat-hint>
                <mat-error *ngIf="!selectedStream">
                  Stream is required
                </mat-error>
              </mat-form-field>

              <div class="stream-info" *ngIf="selectedStream">
                <mat-icon>info</mat-icon>
                <p>
                  <strong>Selected Stream: {{ selectedStream }}</strong><br>
                  This stream will be used to determine eligible subjects for your exam application.
                </p>
              </div>
            </div>

            <!-- No Results Message -->
            <div class="no-results" *ngIf="searchText && filteredInstitutes.length === 0">
              <mat-icon>search_off</mat-icon>
              <p>{{ i18n.t('noInstitutesFound') }}</p>
            </div>

            <!-- Final Confirmation Before Submit -->
            <div class="confirmation-section" *ngIf="selectedInstituteId && selectedStream">
              <div class="confirmation-box">
                <mat-icon>check_box</mat-icon>
                <div>
                  <h3>Confirm Your Selection</h3>
                  <p><strong>Institute:</strong> {{ getInstituteLabel(selectedInstituteId) }}</p>
                  <p><strong>Stream:</strong> {{ selectedStream }}</p>
                  <p class="confirmation-text">
                    ✓ I understand that my Institute and Stream selection <strong>cannot be changed</strong> after submitting this form.
                  </p>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="button-section">
              <button 
                mat-raised-button 
                color="primary" 
                type="submit"
                [disabled]="!selectedInstituteId || !selectedStream || isLoading"
                class="full-width submit-btn"
              >
                <mat-icon *ngIf="!isLoading">arrow_forward</mat-icon>
                <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
                <span *ngIf="!isLoading">{{ i18n.t('continue') }}</span>
                <span *ngIf="isLoading">{{ i18n.t('loading') }}...</span>
              </button>

              <button 
                mat-stroked-button 
                type="button"
                (click)="onLogout()"
                class="full-width logout-btn"
              >
                <mat-icon></mat-icon>
                {{ i18n.t('logout') }}
              </button>
            </div>
          </form>
        </mat-card-content>

        <mat-card-footer class="info-footer">
          <div class="info-message">
            <mat-icon>security</mat-icon>
            <p>Your data is secure. We only use Google authentication to verify your identity. Once you select your Institute and Stream, they will be linked to your profile permanently.</p>
          </div>
        </mat-card-footer>
      </mat-card>

      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="isLoadingInstitutes || isLoadingStreams">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading data...</p>
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
      max-width: 700px;
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
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem 1rem;
      border-radius: 12px 12px 0 0;
      margin: -16px -16px 1rem -16px;
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
      color: #fff;
    }

    /* WARNING BANNERS - BILINGUAL */
    .warning-banner {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      margin: 0 -16px 1.5rem -16px;
      padding-left: 16px;
      padding-right: 16px;
      border-left: 5px solid #ff6b6b;
      background: #fff5f5;
    }

    .warning-banner mat-icon {
      color: #ff0000;
      font-size: 28px;
      width: 28px;
      height: 28px;
      flex-shrink: 0;
      margin-top: 0.25rem;
    }

    .warning-banner strong {
      display: block;
      color: #ff0000;
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
    }

    .warning-banner p {
      margin: 0;
      color: #333;
      line-height: 1.5;
      font-size: 0.95rem;
    }

    .warning-english {
      border-left-color: #ff6b6b;
      background: #fff5f5;
    }

    .warning-marathi {
      border-left-color: #ff9900;
      background: #fff9f0;
      margin-bottom: 0;
    }

    mat-card-content {
      padding: 2rem;
    }

    .select-section {
      margin-bottom: 2.5rem;
    }

    .select-section h2 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      display: block;
      margin-bottom: 1.5rem;
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
      margin: 1.5rem 0 2rem 0;
      padding: 1.5rem;
      background: #f0f7ff;
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

    .stream-info {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #e8f5e9;
      border-radius: 8px;
      margin-top: 1rem;
    }

    .stream-info mat-icon {
      color: #2e7d32;
      flex-shrink: 0;
      margin-top: 0.25rem;
    }

    .stream-info p {
      margin: 0;
      color: #1b5e20;
      font-size: 0.95rem;
      line-height: 1.5;
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

    .confirmation-section {
      margin: 2rem 0;
    }

    .confirmation-box {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      background: #f0f7ff;
      border: 2px solid #667eea;
      border-radius: 8px;
    }

    .confirmation-box mat-icon {
      color: #667eea;
      font-size: 32px;
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      margin-top: 0.25rem;
    }

    .confirmation-box h3 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.1rem;
    }

    .confirmation-box p {
      margin: 0.5rem 0;
      color: #555;
      font-size: 0.95rem;
    }

    .confirmation-text {
      margin-top: 1rem !important;
      padding-top: 1rem;
      border-top: 1px solid #ddd;
      color: #1b5e20 !important;
      font-weight: 500;
    }

    .button-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 2rem;
    }

    .submit-btn,
    .logout-btn {
      height: 48px;
      font-size: 1rem;
      font-weight: 500;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .submit-btn:disabled {
      opacity: 0.5;
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
      line-height: 1.5;
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

      .warning-banner {
        margin-left: -12px;
        margin-right: -12px;
        padding-left: 12px;
        padding-right: 12px;
      }

      .select-section h2 {
        font-size: 1rem;
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
  streams: Stream[] = [];
  
  searchText = '';
  selectedInstituteId: number | null = null;
  selectedStream: string | null = null;
  isLoading = false;
  isLoadingInstitutes = true;
  isLoadingStreams = true;

  ngOnInit() {
    // Check if user is authenticated
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth']);
      return;
    }

    // Load list of institutes and streams
    this.loadInstitutes();
    this.loadStreams();
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

  loadStreams() {
    this.isLoadingStreams = true;
    this.http.get<{ streams: Stream[] }>(`${API_BASE_URL}/masters/streams`)
      .subscribe({
        next: (response) => {
          this.streams = response.streams || [];
          this.isLoadingStreams = false;
        },
        error: (err) => {
          console.error('Failed to load streams:', err);
          this.snackBar.open('Failed to load streams. Please try again.', 'Close', { duration: 5000 });
          this.isLoadingStreams = false;
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

  onInstituteSelected() {
    // Reset stream when institute changes
    this.selectedStream = null;
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

    if (!this.selectedStream) {
      this.snackBar.open('Please select a stream', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    // Save institute and stream selection to backend
    this.http.post(`${API_BASE_URL}/students/select-institute`, {
      instituteId: this.selectedInstituteId,
      streamCode: this.selectedStream
    }).subscribe({
      next: () => {
        this.snackBar.open('✓ Institute and Stream selected successfully! Redirecting to dashboard...', 'Close', { duration: 3000 });
        setTimeout(() => {
          this.router.navigate(['/app/dashboard']);
        }, 1000);
      },
      error: (err) => {
        console.error('Failed to save selection:', err);
        this.isLoading = false;
        
        // Check for specific error messages
        if (err.error?.error === 'INSTITUTE_ALREADY_SELECTED') {
          this.snackBar.open(
            '⚠️ Institute and Stream cannot be changed after initial selection. Please contact support.',
            'Close',
            { duration: 8000}
          );
        } else {
          this.snackBar.open('Failed to save selection. Please try again.', 'Close', { duration: 5000 });
        }
      }
    });
  }

  onLogout() {
    this.auth.logout();
    this.router.navigate(['/auth']);
  }
}
