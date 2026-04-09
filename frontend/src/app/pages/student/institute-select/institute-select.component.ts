import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCard } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel, MatHint } from '@angular/material/form-field';
import { MatSelect, MatSelectTrigger } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { API_BASE_URL } from '../../../core/api';
import { AuthService } from '../../../core/auth.service';
import { StudentProfileService } from '../../../core/student-profile.service';
import { I18nService } from '../../../core/i18n.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatInput } from '@angular/material/input';

interface Institute {
  id: number;
  name: string;
  district: string;
  city: string;
  code?: string;
  collegeNo?: string;
  udiseNo?: string;
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
    MatButton,
    MatIcon,
    MatFormField,
    MatLabel,
    MatSelect,
    MatSelectTrigger,
    MatOption,
    MatProgressSpinner,
    MatHint,
    MatInput
  ],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  template: `
    <div class="institute-select-container">
      <!-- Header Section -->
      <div class="header-section">
        <div class="header-content">
          <h1>Complete Your Profile</h1>
          <p class="tagline">Select your institute and stream to get started</p>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Progress Indicator -->
        <div class="progress-section">
          <div class="progress-step" [class.active]="true" [class.completed]="selectedInstituteId">
            <div class="step-number">1</div>
            <div class="step-label">Institute</div>
          </div>
          <div class="progress-line" [class.active]="selectedInstituteId && selectedStream"></div>
          <div class="progress-step" [class.active]="selectedInstituteId" [class.completed]="selectedStream">
            <div class="step-number">2</div>
            <div class="step-label">Stream</div>
          </div>
        </div>

        <!-- Info Banner -->
        <div class="warning-section">
          <div class="warning-box info-style">
            <mat-icon>info</mat-icon>
            <div class="warning-content">
              <h3>ℹ️ Selection Update</h3>
              <p>You can change your institute and stream selection anytime. Please select carefully.</p>
              <p class="marathi">आप कभी भी अपनी संस्था व प्रवाह निवड बदल सकते हैं।</p>
            </div>
          </div>
        </div>

        <form (ngSubmit)="onSubmit()" class="selection-form">
          <!-- Institute Selection Card -->
          <div class="form-section">
            <div class="section-header">
              <div class="section-badge">1</div>
              <div>
                <h2>Select Your Institute</h2>
                <p>Search and choose your educational institution</p>
              </div>
            </div>

            <!-- Search Input -->
            <div class="search-wrapper">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Search Institute</mat-label>
                <mat-icon matPrefix>search</mat-icon>
                <input 
                  type="text" 
                  matInput 
                  [(ngModel)]="searchText" 
                  name="search"
                  (keyup)="filterInstitutes()"
                  placeholder="Type institute name or code..."
                  class="search-input"
                />
              </mat-form-field>
            </div>

            <!-- Institute Dropdown -->
            <div class="select-wrapper">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Choose Institute</mat-label>
                <mat-icon matPrefix>business</mat-icon>
                <mat-select 
                  [(ngModel)]="selectedInstituteId" 
                  name="institute" 
                  required 
                  (selectionChange)="onInstituteSelected()"
                  class="institute-select"
                  panelClass="student-institute-panel"
                >
                  <mat-select-trigger>
                    @if (selectedInstitute) {
                      <div class="selected-trigger">
                        <span class="trigger-name">{{ selectedInstitute.name }}</span>
                        <span class="trigger-meta">{{ getInstituteCode(selectedInstitute) || 'No code' }} • {{ selectedInstitute.city || selectedInstitute.district || 'Location not available' }}</span>
                      </div>
                    } @else {
                      <span class="placeholder-trigger">Select institute / organisation</span>
                    }
                  </mat-select-trigger>

                  <mat-optgroup *ngFor="let group of groupedInstitutes" [label]="group.district" class="district-group">
                    <mat-option 
                      *ngFor="let institute of group.institutes" 
                      [value]="institute.id"
                      class="institute-option-item"
                    >
                      <div class="option-content">
                        <span class="option-name">{{ institute.name }}</span>
                        <span class="option-meta">{{ institute.city || 'City not available' }}{{ institute.district ? ' • ' + institute.district : '' }}</span>
                        <span class="option-code">Institute Code: {{ getInstituteCode(institute) || 'N/A' }}</span>
                      </div>
                    </mat-option>
                  </mat-optgroup>
                </mat-select>
                <mat-hint class="select-hint">Grouped by district for easier selection on mobile and desktop</mat-hint>
              </mat-form-field>
            </div>

            <!-- Selected Institute Card -->
            <div class="selected-card" *ngIf="selectedInstitute" [@slideIn]>
              <div class="card-header">
                <mat-icon class="success-icon">school</mat-icon>
                <h3>{{ selectedInstitute.name }}</h3>
              </div>
              <div class="card-body">
                <div class="info-row">
                  <span class="label">Institute Code:</span>
                  <span class="value code-badge">{{ getInstituteCode(selectedInstitute) || 'N/A' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Location:</span>
                  <span class="value">{{ selectedInstitute.district }}, {{ selectedInstitute.city }}</span>
                </div>
              </div>
              <div class="card-footer">
                <mat-icon>check_circle</mat-icon>
                <span>Institute selected</span>
              </div>
            </div>

            <!-- No Results -->
            <div class="no-results" *ngIf="searchText && filteredInstitutes.length === 0">
              <mat-icon>search_off</mat-icon>
              <p>No institutes found for "<strong>{{ searchText }}</strong>"</p>
            </div>
          </div>

          <!-- Stream Selection Card -->
          <div class="form-section" *ngIf="selectedInstituteId" [@slideIn]>
            <div class="section-header">
              <div class="section-badge stream-badge">2</div>
              <div>
                <h2>Select Your Stream</h2>
                <p>Choose the academic stream for your studies</p>
              </div>
            </div>

            <!-- Stream Dropdown -->
            <div class="select-wrapper">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Choose Stream</mat-label>
                <mat-icon matPrefix>layers</mat-icon>
                <mat-select 
                  [(ngModel)]="selectedStream" 
                  name="stream" 
                  required
                  class="stream-select"
                >
                  <mat-option *ngFor="let stream of streams" [value]="stream.name">
                    <div class="stream-option">{{ stream.name }}</div>
                  </mat-option>
                </mat-select>
                <mat-hint>Determines which subjects are available for you</mat-hint>
              </mat-form-field>
            </div>

            <!-- Selected Stream Card -->
            <div class="selected-card stream-card" *ngIf="selectedStream" [@slideIn]>
              <div class="card-header">
                <mat-icon class="info-icon">layers</mat-icon>
                <h3>{{ selectedStream }}</h3>
              </div>
              <div class="card-body">
                <p>This selection determines which subjects and exams are available for you.</p>
              </div>
              <div class="card-footer">
                <mat-icon>check_circle</mat-icon>
                <span>Stream selected</span>
              </div>
            </div>
          </div>

          <!-- Confirmation Section -->
          <div class="confirmation-section" *ngIf="selectedInstituteId && selectedStream" [@slideIn]>
            <div class="summary-box">
              <h3>Summary of Your Selection</h3>
              <div class="summary-content">
                <div class="summary-item">
                  <mat-icon>school</mat-icon>
                  <div>
                    <span class="summary-label">Institute:</span>
                    <span class="summary-value">{{ getInstituteLabel(selectedInstituteId) }}</span>
                  </div>
                </div>
                <div class="summary-item">
                  <mat-icon>layers</mat-icon>
                  <div>
                    <span class="summary-label">Stream:</span>
                    <span class="summary-value">{{ selectedStream }}</span>
                  </div>
                </div>
              </div>
              <div class="confirmation-notice">
                <mat-icon>info</mat-icon>
                <p>These details will be permanently linked to your profile.</p>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="button-section">
            <button 
              mat-raised-button 
              color="primary" 
              type="submit"
              [disabled]="!selectedInstituteId || !selectedStream || isLoading"
              class="submit-btn"
            >
              <mat-icon *ngIf="!isLoading">check_circle</mat-icon>
              <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
              <span *ngIf="!isLoading">Confirm & Continue</span>
              <span *ngIf="isLoading">Saving...</span>
            </button>
            <button 
              mat-stroked-button 
              type="button"
              (click)="onLogout()"
              class="logout-btn"
            >
              <mat-icon>logout</mat-icon>
              Logout
            </button>
          </div>
        </form>
      </div>

      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="isLoadingInstitutes || isLoadingStreams">
        <div class="spinner-wrapper">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Loading data...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .institute-select-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem 1rem;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    /* Header Section */
    .header-section {
      text-align: center;
      color: white;
      margin-bottom: 3rem;
      animation: slideDown 0.6s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .header-content h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      letter-spacing: -0.5px;
    }

    .header-content .tagline {
      font-size: 1.1rem;
      opacity: 0.95;
      margin: 0;
      font-weight: 300;
    }

    /* Main Content */
    .main-content {
      max-width: 700px;
      margin: 0 auto;
      animation: slideUp 0.6s ease-out 0.1s both;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Progress Indicator */
    .progress-section {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }

    .progress-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .step-number {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.1rem;
      transition: all 0.3s ease;
    }

    .progress-step.active .step-number {
      background: rgba(255, 255, 255, 0.6);
      box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2);
    }

    .progress-step.completed .step-number {
      background: #4caf50;
      color: white;
    }

    .step-label {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.8);
      font-weight: 500;
    }

    .progress-line {
      width: 30px;
      height: 2px;
      background: rgba(255, 255, 255, 0.2);
      transition: background 0.3s ease;
    }

    .progress-line.active {
      background: rgba(255, 255, 255, 0.6);
    }

    /* Warning Section */
    .warning-section {
      margin-bottom: 2rem;
    }

    .warning-box {
      display: flex;
      gap: 1.5rem;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      border-left: 5px solid #ff9800;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .warning-box.info-style {
      border-left-color: #2196F3;
    }

    .warning-box.info-style h3 {
      color: #2196F3;
    }

    .warning-box.info-style mat-icon {
      color: #2196F3;
    }

    .warning-box mat-icon {
      color: #ff9800;
      font-size: 28px;
      width: 28px;
      height: 28px;
      flex-shrink: 0;
      margin-top: 0.2rem;
    }

    .warning-content h3 {
      margin: 0 0 0.5rem 0;
      color: #ff6f00;
      font-size: 1.05rem;
      font-weight: 600;
    }

    .warning-content p {
      margin: 0.5rem 0;
      color: #333;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .warning-content .marathi {
      font-size: 0.9rem;
      color: #666;
      font-style: italic;
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #eee;
    }

    /* Form Sections */
    .form-section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .section-header {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 2rem;
      align-items: flex-start;
    }

    .section-badge {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.3rem;
      flex-shrink: 0;
    }

    .section-badge.stream-badge {
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
    }

    .section-header h2 {
      font-size: 1.4rem;
      font-weight: 600;
      color: #333;
      margin: 0 0 0.3rem 0;
    }

    .section-header p {
      margin: 0;
      color: #666;
      font-size: 0.95rem;
    }

    /* Search Wrapper */
    .search-wrapper {
      margin-bottom: 1.5rem;
    }

    .search-field {
      width: 100%;
    }

    /* Select Wrapper */
    .select-wrapper {
      margin-bottom: 1.5rem;
    }

    mat-form-field {
      width: 100%;
      display: block;
    }

    .selected-trigger {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
      padding: 0.15rem 0;
    }

    .trigger-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: #1f2937;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .trigger-meta,
    .placeholder-trigger {
      font-size: 0.78rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .option-content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.15rem;
      width: 100%;
      min-width: 0;
      padding-right: 0.5rem;
    }

    .option-name {
      display: block;
      font-weight: 600;
      font-size: 0.95rem;
      line-height: 1.35;
      color: #111827;
      white-space: normal;
      word-break: break-word;
    }

    .option-meta,
    .option-code {
      display: block;
      font-size: 0.78rem;
      line-height: 1.35;
      color: #64748b;
      white-space: normal;
      word-break: break-word;
    }

    .select-hint {
      font-size: 0.78rem;
      color: #64748b;
    }

    :host ::ng-deep .student-institute-panel {
      max-width: min(720px, calc(100vw - 16px)) !important;
      max-height: min(70vh, 460px) !important;
      border-radius: 14px !important;
      padding: 0.3rem 0 !important;
    }

    :host ::ng-deep .student-institute-panel .mat-mdc-optgroup-label {
      position: sticky;
      top: 0;
      z-index: 1;
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      border-bottom: 1px solid #dbeafe;
    }

    :host ::ng-deep .student-institute-panel .mat-mdc-option {
      min-height: 74px !important;
      height: auto !important;
      padding-top: 0.6rem !important;
      padding-bottom: 0.6rem !important;
      align-items: flex-start !important;
    }

    :host ::ng-deep .student-institute-panel .mdc-list-item__primary-text {
      white-space: normal !important;
      line-height: 1.3 !important;
      width: 100%;
    }

    :host ::ng-deep .student-institute-panel .mat-pseudo-checkbox {
      margin-top: 0.35rem;
    }

    /* Selected Card */
    .selected-card {
      margin-top: 1.5rem;
      border: 2px solid #667eea;
      border-radius: 12px;
      overflow: hidden;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
    }

    .selected-card.stream-card {
      border-color: #4caf50;
      background: linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(69, 160, 73, 0.05) 100%);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .selected-card.stream-card .card-header {
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
    }

    .card-header mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .card-header h3 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
      flex: 1;
    }

    .card-body {
      padding: 1.5rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-row .label {
      color: #666;
      font-size: 0.95rem;
      font-weight: 500;
    }

    .info-row .value {
      color: #333;
      font-size: 0.95rem;
      font-weight: 600;
    }

    .code-badge {
      background: #f0f0f0;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
      color: #667eea;
    }

    .card-footer {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      background: rgba(0, 0, 0, 0.02);
      border-top: 1px solid rgba(0, 0, 0, 0.05);
      color: #4caf50;
      font-weight: 500;
      font-size: 0.95rem;
    }

    .card-footer mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* No Results */
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

    .no-results p {
      margin: 0;
      font-size: 1rem;
    }

    /* Confirmation Section */
    .confirmation-section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .summary-box h3 {
      margin: 0 0 1.5rem 0;
      font-size: 1.2rem;
      font-weight: 600;
      color: #333;
    }

    .summary-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid #eee;
    }

    .summary-item {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .summary-item mat-icon {
      color: #667eea;
      flex-shrink: 0;
      margin-top: 0.2rem;
    }

    .summary-label {
      display: block;
      color: #666;
      font-size: 0.9rem;
      font-weight: 500;
      margin-bottom: 0.3rem;
    }

    .summary-value {
      display: block;
      color: #333;
      font-size: 1rem;
      font-weight: 600;
    }

    .confirmation-notice {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #e8f5e9;
      border-radius: 8px;
      color: #1b5e20;
    }

    .confirmation-notice mat-icon {
      color: #2e7d32;
      flex-shrink: 0;
    }

    .confirmation-notice p {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    /* Button Section */
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
      font-weight: 600;
      border-radius: 8px;
      transition: all 0.3s ease;
      text-transform: none;
      letter-spacing: 0;
    }

    .submit-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .submit-btn:hover:not(:disabled) {
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
      transform: translateY(-2px);
    }

    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .logout-btn {
      border: 2px solid #ddd;
      color: #333;
    }

    .logout-btn:hover:not(:disabled) {
      border-color: #667eea;
      color: #667eea;
      background: rgba(102, 126, 234, 0.05);
    }

    mat-spinner {
      display: inline-block;
      margin-right: 0.75rem;
    }

    /* Loading Overlay */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(2px);
    }

    .spinner-wrapper {
      text-align: center;
      color: white;
    }

    .spinner-wrapper mat-spinner {
      margin: 0 auto 1rem;
    }

    .spinner-wrapper p {
      font-size: 1rem;
      margin: 0;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .header-content h1 {
        font-size: 1.8rem;
      }

      .header-content .tagline {
        font-size: 1rem;
      }

      .progress-section {
        gap: 0.5rem;
        padding: 1rem;
      }

      .step-number {
        width: 36px;
        height: 36px;
        font-size: 1rem;
      }

      .progress-line {
        width: 20px;
      }

      .form-section {
        padding: 1.5rem;
      }

      .section-header {
        gap: 1rem;
      }

      .section-badge {
        width: 40px;
        height: 40px;
        font-size: 1.1rem;
      }

      .section-header h2 {
        font-size: 1.2rem;
      }

      .card-header {
        padding: 1rem;
      }

      .card-body {
        padding: 1rem;
      }

      .confirmation-section {
        padding: 1.5rem;
      }

      .submit-btn,
      .logout-btn {
        height: 44px;
        font-size: 0.95rem;
      }
    }

    @media (max-width: 480px) {
      .institute-select-container {
        padding: 1rem 0.75rem;
      }

      .header-content h1 {
        font-size: 1.5rem;
        margin-bottom: 0.3rem;
      }

      .header-content {
        margin-bottom: 2rem;
      }

      .header-content .tagline {
        font-size: 0.95rem;
      }

      .progress-section {
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .progress-line {
        width: 2px;
        height: 30px;
      }

      .warning-box {
        gap: 1rem;
        padding: 1.2rem;
      }

      .warning-box mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .warning-content h3 {
        font-size: 1rem;
      }

      .warning-content p {
        font-size: 0.9rem;
      }

      .form-section {
        padding: 1.2rem;
        margin-bottom: 1rem;
      }

      .section-header {
        gap: 0.75rem;
        margin-bottom: 1.5rem;
      }

      .section-badge {
        width: 36px;
        height: 36px;
        font-size: 1rem;
      }

      .section-header h2 {
        font-size: 1.1rem;
        margin-bottom: 0.2rem;
      }

      .section-header p {
        font-size: 0.9rem;
      }

      .card-header {
        padding: 0.8rem;
        gap: 0.75rem;
      }

      .card-header h3 {
        font-size: 1.05rem;
      }

      .card-body {
        padding: 0.8rem;
      }

      .info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.4rem;
        padding: 0.6rem 0;
      }

      .card-footer {
        padding: 0.75rem 0.8rem;
        font-size: 0.9rem;
      }

      .confirmation-section {
        padding: 1.2rem;
      }

      .summary-box h3 {
        font-size: 1.1rem;
        margin-bottom: 1rem;
      }

      .confirmation-notice {
        padding: 0.75rem;
      }

      .conclusion-notice p {
        font-size: 0.9rem;
      }

      .submit-btn,
      .logout-btn {
        height: 40px;
        font-size: 0.9rem;
      }

      .button-section {
        gap: 0.75rem;
        margin-top: 1.5rem;
      }

      .selected-trigger {
        padding-right: 0.35rem;
      }

      .trigger-name {
        font-size: 0.9rem;
      }

      .trigger-meta,
      .placeholder-trigger,
      .option-meta,
      .option-code {
        font-size: 0.74rem;
      }

      .option-name {
        font-size: 0.9rem;
      }

      :host ::ng-deep .student-institute-panel {
        max-width: calc(100vw - 12px) !important;
      }

      :host ::ng-deep .student-institute-panel .mat-mdc-option {
        min-height: 84px !important;
      }
    }

    @media (max-width: 360px) {
      .header-content h1 {
        font-size: 1.3rem;
      }

      .form-section {
        padding: 1rem;
        margin-bottom: 0.75rem;
      }

      .section-header {
        gap: 0.5rem;
      }

      .section-header h2 {
        font-size: 1rem;
      }

      .submit-btn,
      .logout-btn {
        height: 38px;
        font-size: 0.85rem;
      }
    }
  `]
})
export class InstituteSelectComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private profileService = inject(StudentProfileService);
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

    // Check if student has already selected an institute
    this.checkIfInstituteAlreadySelected();
  }

  /**
   * Check if student has already selected an institute
   * If yes, redirect to student profile page
   * If no, allow them to select institute
   */
  private checkIfInstituteAlreadySelected() {
    this.profileService.loadProfile()
      .then((profile: any) => {
        // If profile exists and has institute selected (instituteId exists), redirect to profile page
        // streamCode can be empty/null initially, but instituteId indicates selection has been made
        if (profile && profile.instituteId) {
          console.log('Institute already selected. Redirecting to profile page.', profile.instituteId);
          this.snackBar.open('✓ Institute already selected. Redirecting to your profile...', 'Close', { duration: 2000 });
          setTimeout(() => {
            this.router.navigate(['/student/profile']);
          }, 500);
          return;
        }
        
        // Otherwise, load institutes and streams for selection
        console.log('No institute selected. Showing selection form.');
        this.loadInstitutes();
        this.loadStreams();
      })
      .catch((err: any) => {
        // If error is institute not selected (404 or specific error), allow selection
        const errorCode = err?.error?.error || err?.message;
        if (errorCode === 'INSTITUTE_NOT_SELECTED' || 
            errorCode === 'STUDENT_PROFILE_MISSING' || 
            err?.status === 404) {
          console.log('No institute selected yet. Showing selection form.');
          this.loadInstitutes();
          this.loadStreams();
          return;
        }
        
        // For session expiry (401), redirect to login
        if (err?.status === 401) {
          console.warn('Session expired. Redirecting to login.');
          this.router.navigate(['/login']);
          return;
        }
        
        // For other errors, still show selection form (network error, etc)
        console.warn('Error checking profile:', err);
        this.loadInstitutes();
        this.loadStreams();
      });
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
        (inst.name?.toLowerCase() || '').includes(search) ||
        this.getInstituteCode(inst).toLowerCase().includes(search) ||
        (inst.district?.toLowerCase() || '').includes(search) ||
        (inst.city?.toLowerCase() || '').includes(search)
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

  getInstituteCode(inst: Institute | null | undefined): string {
    return String(inst?.code || inst?.collegeNo || inst?.udiseNo || '').trim();
  }

  getInstituteLabel(id: number | null): string {
    if (!id) return '';
    const inst = this.institutes.find(i => i.id === id);
    const code = this.getInstituteCode(inst);
    return inst ? `${inst.name}${code ? ` (${code})` : ''}` : '';
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
    this.http.post<any>(`${API_BASE_URL}/students/select-institute`, {
      instituteId: this.selectedInstituteId,
      streamCode: this.selectedStream
    }).subscribe({
      next: (response) => {
        // Update access token with the new one that includes instituteId
        if (response.accessToken) {
          this.auth.updateAccessToken(response.accessToken);
        }
        this.snackBar.open('✓ Institute and Stream selected successfully! Redirecting to profile...', 'Close', { duration: 3000 });
        // Load profile to check completion percentage and redirect accordingly
        setTimeout(() => {
          this.profileService.loadProfile()
            .then((profile: any) => {
              const completionPercentage = this.profileService.completionPercentage$();
              // If profile > 70% complete, redirect to dashboard; otherwise to profile for editing
              if (completionPercentage >= 70) {
                this.router.navigate(['/student/dashboard']);
              } else {
                this.router.navigate(['/student/profile']);
              }
            })
            .catch(() => {
              // If profile loading fails, redirect to profile page to start filling it
              this.router.navigate(['/student/profile']);
            });
        }, 1000);
      },
      error: (err) => {
        console.error('Failed to save selection:', err);
        this.isLoading = false;
        
        // Check for specific error messages
        if (err.error?.error === 'INSTITUTE_ALREADY_SELECTED' || err.status === 409) {
          // Institute already selected (409 conflict) - load profile and redirect based on completion
          this.snackBar.open(
            '✓ Institute already selected. Redirecting to your profile...',
            'Close',
            { duration: 3000}
          );
          setTimeout(() => {
            this.profileService.loadProfile()
              .then((profile: any) => {
                const completionPercentage = this.profileService.completionPercentage$();
                if (completionPercentage >= 70) {
                  this.router.navigate(['/student/dashboard']);
                } else {
                  this.router.navigate(['/student/profile']);
                }
              })
              .catch(() => {
                // If any error, still redirect to profile
                this.router.navigate(['/student/profile']);
              });
          }, 500);
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
