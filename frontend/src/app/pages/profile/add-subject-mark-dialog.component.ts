import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { I18nService } from '../../core/i18n.service';
import { SubjectMarks } from '../../core/student-profile.service';

@Component({
  selector: 'app-add-subject-mark-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>{{ i18n.t('addSubject') }}</h2>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-dialog-content>
          <div class="form-group">
            <mat-form-field class="full-width">
              <mat-label>{{ i18n.t('selectSubject') }}</mat-label>
              <mat-select formControlName="subjectId" required>
                <mat-option *ngFor="let subject of subjects" [value]="subject.id">
                  {{ subject.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="form-group">
            <mat-form-field class="full-width">
              <mat-label>{{ i18n.t('subjectName') }}</mat-label>
              <input matInput formControlName="subjectName" placeholder="e.g., English, Mathematics" required />
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field class="form-field">
              <mat-label>{{ i18n.t('maxMarks') }}</mat-label>
              <input matInput type="number" formControlName="maxMarks" placeholder="e.g., 100" required />
            </mat-form-field>
            <mat-form-field class="form-field">
              <mat-label>{{ i18n.t('obtainedMarks') }}</mat-label>
              <input matInput type="number" formControlName="obtainedMarks" placeholder="e.g., 85" required />
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field class="form-field">
              <mat-label>{{ i18n.t('grade') }}</mat-label>
              <mat-select formControlName="grade">
                <mat-option value="A+">A+</mat-option>
                <mat-option value="A">A</mat-option>
                <mat-option value="B+">B+</mat-option>
                <mat-option value="B">B</mat-option>
                <mat-option value="C">C</mat-option>
                <mat-option value="D">D</mat-option>
                <mat-option value="E">E</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="checkbox-group">
            <mat-checkbox formControlName="isBacklog">
              {{ i18n.t('isBacklogSubject') }}
            </mat-checkbox>
          </div>

          <!-- Percentage Display -->
          <div class="percentage-display" *ngIf="percentage > 0">
            <span class="label">{{ i18n.t('percentage') }}:</span>
            <span class="value">{{ percentage | number : '1.0-0' }}%</span>
          </div>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
          <button mat-button [mat-dialog-close]>{{ i18n.t('cancel') }}</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
            {{ i18n.t('add') }}
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: min(520px, 100%);
      padding: 0;
    }

    mat-dialog-content {
      padding: 1.5rem 0;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-field,
    .full-width {
      width: 100%;
    }

    .checkbox-group {
      margin: 1.5rem 0;
      padding: 1rem;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .percentage-display {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background-color: #e8f5e9;
      border-radius: 4px;
      margin-top: 1rem;
      font-weight: 600;
    }

    .percentage-display .label {
      color: #333;
    }

    .percentage-display .value {
      color: #2e7d32;
      font-size: 1.2rem;
    }

    mat-dialog-actions {
      padding: 1rem 0 0 0;
      gap: 0.5rem;
    }

    @media (max-width: 600px) {
      .dialog-container {
        width: 100%;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      mat-dialog-actions {
        flex-direction: column;
      }

      mat-dialog-actions button {
        width: 100%;
      }
    }
  `]
})
export class AddSubjectMarkDialogComponent {
  readonly i18n = inject(I18nService);
  private readonly fb: FormBuilder = inject(FormBuilder);
  
  form: FormGroup;
  percentage = 0;

  subjects = [
    { id: 1, name: 'English' },
    { id: 2, name: 'Mathematics' },
    { id: 3, name: 'Physics' },
    { id: 4, name: 'Chemistry' },
    { id: 5, name: 'Biology' },
    { id: 6, name: 'Marathi' },
    { id: 7, name: 'Hindi' },
    { id: 8, name: 'Economics' },
    { id: 9, name: 'History' },
    { id: 10, name: 'Geography' }
  ];

  constructor(
    public dialogRef: MatDialogRef<AddSubjectMarkDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { isBacklog: boolean }
  ) {
    this.form = this.fb.group({
      subjectId: ['', [Validators.required]],
      subjectName: ['', [Validators.required]],
      maxMarks: [100, [Validators.required, Validators.min(1)]],
      obtainedMarks: ['', [Validators.required, Validators.min(0)]],
      grade: [''],
      isBacklog: [data.isBacklog]
    });

    // Update percentage when marks change
    this.form.get('maxMarks')?.valueChanges.subscribe(() => this.updatePercentage());
    this.form.get('obtainedMarks')?.valueChanges.subscribe(() => this.updatePercentage());
  }

  updatePercentage() {
    const max = this.form.get('maxMarks')?.value;
    const obtained = this.form.get('obtainedMarks')?.value;

    if (max && obtained) {
      this.percentage = (obtained / max) * 100;
    }
  }

  onSubmit() {
    if (this.form.valid) {
      const subject: SubjectMarks = {
        ...this.form.value,
        percentage: this.percentage
      };
      this.dialogRef.close(subject);
    }
  }
}
