import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { API_BASE_URL } from '../../../core/api';
import { PincodeService, PostalLocation } from '../../../core/pincode.service';

@Component({
  selector: 'app-institute-settings',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule],
  template: `
    <mat-card class="card">
      <div class="header-row">
        <div>
          <div class="h">Institute Basic Details</div>
          <div class="p">Update institute address and contact details. Exam intake settings are now handled separately during exam or subject mapping.</div>
        </div>
      </div>

      <form [formGroup]="detailsForm" (ngSubmit)="saveDetails()" class="details-form">
        <div class="grid">
          <mat-form-field appearance="outline" class="full-width"><mat-label>Institute Name</mat-label><input matInput formControlName="name" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>College No (Unique No)</mat-label><input matInput formControlName="collegeNo" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>UDISE No</mat-label><input matInput formControlName="udiseNo" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Center No</mat-label><input matInput formControlName="code" placeholder="Optional" /><mat-hint>Optional field</mat-hint></mat-form-field>
        </div>

        <div class="grid">
          <mat-form-field appearance="outline" class="full-width"><mat-label>Address</mat-label><input matInput formControlName="address" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Pincode</mat-label><input matInput formControlName="pincode" maxlength="6" inputmode="numeric" /><mat-hint *ngIf="pincodeLookupLoading()">Fetching address…</mat-hint></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>State</mat-label><input matInput formControlName="state" readonly /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>District</mat-label><input matInput formControlName="district" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Taluka</mat-label><input matInput formControlName="taluka" /></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Place / Village</mat-label>
            <mat-select *ngIf="pincodeOptions().length; else manualPlaceInput" formControlName="city" (selectionChange)="onPlaceSelected($event.value)">
              <mat-option *ngFor="let location of pincodeOptions()" [value]="getPlaceValue(location)">
                {{ getPlaceLabel(location) }}
              </mat-option>
            </mat-select>
            <ng-template #manualPlaceInput>
              <input matInput formControlName="city" />
            </ng-template>
            <mat-hint *ngIf="pincodeError()">{{ pincodeError() }}</mat-hint>
          </mat-form-field>
        </div>

        <div class="grid">
          <mat-form-field appearance="outline"><mat-label>Contact Person</mat-label><input matInput formControlName="contactPerson" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Contact Email</mat-label><input matInput formControlName="contactEmail" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Contact Mobile</mat-label><input matInput formControlName="contactMobile" maxlength="10" /></mat-form-field>
        </div>

        <div class="actions">
          <button mat-flat-button color="primary" [disabled]="detailsForm.invalid || loadingDetails()">
            {{ loadingDetails() ? 'Saving…' : 'Save institute details' }}
          </button>
        </div>
      </form>

      <p class="success" *ngIf="savedDetails()">Institute details updated successfully.</p>
      <div class="error" *ngIf="errorDetails()">{{ errorDetails() }}</div>
    </mat-card>

  `,
  styles: [`
    .card { margin-bottom: 14px; padding: 20px; border-radius: 14px; }
    .header-row { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
    .h { font-weight: 800; margin-bottom: 4px; }
    .p { color: #6b7280; margin-bottom: 0; line-height: 1.45; }
    .details-form { display: grid; gap: 14px; }
    .grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom: 0; }
    .full-width { grid-column: 1 / -1; }
    .actions { display: flex; justify-content: flex-start; margin-top: 4px; padding-top: 4px; }
    .actions button { min-height: 40px; }
    .success { color: #065f46; font-size: 13px; margin-top: 10px; }
    .error { color: #b91c1c; font-size: 13px; margin-top: 10px; }

    @media (max-width: 768px) {
      .card { padding: 14px; }
      .details-form { gap: 10px; }
      .grid { gap: 10px; }
      .actions { width: 100%; }
      .actions button { width: 100%; }
    }
  `]
})
export class InstituteSettingsComponent implements OnInit, OnDestroy {
  readonly detailsForm = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(50)] }),
    collegeNo: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    udiseNo: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    name: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
    state: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    district: new FormControl('', { nonNullable: true }),
    taluka: new FormControl('', { nonNullable: true }),
    city: new FormControl('', { nonNullable: true }),
    pincode: new FormControl('', { nonNullable: true, validators: [Validators.pattern(/^\d{0,6}$/)] }),
    contactPerson: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    contactEmail: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    contactMobile: new FormControl('', { nonNullable: true, validators: [Validators.pattern(/^\d{0,10}$/)] })
  });

  readonly loadingDetails = signal(false);
  readonly savedDetails = signal(false);
  readonly errorDetails = signal<string | null>(null);
  readonly pincodeOptions = signal<PostalLocation[]>([]);
  readonly pincodeLookupLoading = signal(false);
  readonly pincodeError = signal<string | null>(null);
  private readonly subscriptions = new Subscription();

  constructor(private readonly http: HttpClient, private readonly snackBar: MatSnackBar, private readonly pincodeService: PincodeService) {}

  ngOnInit() {
    this.load();
    this.subscriptions.add(this.detailsForm.controls.pincode.valueChanges.subscribe((value) => this.onPincodeChanged(value || '')));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  load() {
    this.http.get<any>(`${API_BASE_URL}/institutes/me`).subscribe({
      next: (r) => {
        this.detailsForm.patchValue({
          code: r.institute.centerNo ?? r.institute.code ?? '',
          collegeNo: r.institute.uniqueNo ?? r.institute.collegeNo ?? '',
          udiseNo: r.institute.udiseNo ?? '',
          name: r.institute.name ?? '',
          address: r.institute.address ?? '',
          state: '',
          district: r.institute.district ?? '',
          taluka: r.institute.taluka ?? '',
          city: r.institute.city ?? '',
          pincode: r.institute.pincode ?? '',
          contactPerson: r.institute.contactPerson ?? '',
          contactEmail: r.institute.contactEmail ?? '',
          contactMobile: r.institute.contactMobile ?? ''
        }, { emitEvent: false });
        const pincode = String(r.institute.pincode || '').trim();
        if (/^\d{6}$/.test(pincode)) this.lookupPincode(pincode, false);
      },
      error: (e) => this.showError(e, 'Unable to load institute data')
    });
  }

  saveDetails() {
    if (this.detailsForm.invalid) return;
    this.loadingDetails.set(true);
    this.savedDetails.set(false);
    this.errorDetails.set(null);

    const raw = this.detailsForm.getRawValue();
    const payload = {
      code: raw.code?.trim().toUpperCase(),
      address: String(raw.address || '').trim().toUpperCase(),
      city: String(raw.city || '').trim().toUpperCase(),
      district: String(raw.district || '').trim().toUpperCase(),
      taluka: String(raw.taluka || '').trim().toUpperCase(),
      pincode: raw.pincode,
      contactPerson: String(raw.contactPerson || '').trim().toUpperCase(),
      contactEmail: String(raw.contactEmail || '').trim(),
      contactMobile: raw.contactMobile
    };

    this.http.patch(`${API_BASE_URL}/institutes/me`, payload).subscribe({
      next: () => {
        this.loadingDetails.set(false);
        this.savedDetails.set(true);
        this.load();
        this.snackBar.open('Institute details updated', 'Close', { duration: 2000 });
      },
      error: (e) => {
        this.loadingDetails.set(false);
        this.errorDetails.set('Save failed');
        this.showError(e, 'Save failed');
      }
    });
  }

  private showError(err: any, fallback: string) {
    const message = err?.error?.message || err?.error?.error || err?.message || fallback;
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  private onPincodeChanged(value: string): void {
    const pincode = String(value || '').replace(/\D/g, '').slice(0, 6);
    if (pincode !== value) {
      this.detailsForm.controls.pincode.setValue(pincode, { emitEvent: false });
    }
    this.pincodeError.set(null);
    this.pincodeOptions.set([]);
    if (!pincode) return;
    if (pincode.length < 6) {
      this.pincodeError.set('Enter 6 digit pincode');
      return;
    }
    this.lookupPincode(pincode, true);
  }

  private lookupPincode(pincode: string, overwritePlace: boolean): void {
    this.pincodeLookupLoading.set(true);
    this.pincodeError.set(null);
    this.pincodeService.getPincodeDetails(pincode).subscribe({
      next: (locations) => {
        this.pincodeLookupLoading.set(false);
        this.pincodeOptions.set(locations);
        if (!locations.length) {
          this.pincodeError.set('No place found for this pincode');
          return;
        }
        this.applyLocation(locations[0], overwritePlace);
      },
      error: () => {
        this.pincodeLookupLoading.set(false);
        this.pincodeError.set('Unable to fetch pincode details');
      }
    });
  }

  onPlaceSelected(place: string): void {
    const selectedPlace = String(place || '').trim().toUpperCase();
    const location = this.pincodeOptions().find((option) => this.getPlaceValue(option) === selectedPlace);
    if (location) this.applyLocation(location, true);
  }

  getPlaceValue(location: PostalLocation): string {
    return String(location.village || location.officeName || '').trim().toUpperCase();
  }

  getPlaceLabel(location: PostalLocation): string {
    const place = this.getPlaceValue(location);
    const officeType = String(location.officeType || '').trim().toUpperCase();
    return [place, officeType].filter(Boolean).join(' - ');
  }

  private applyLocation(location: PostalLocation, overwritePlace: boolean): void {
    const patch: Partial<Record<keyof typeof this.detailsForm.controls, string>> = {
      state: String(location.state || '').trim().toUpperCase(),
      district: String(location.district || '').trim().toUpperCase(),
      taluka: String(location.taluka || '').trim().toUpperCase()
    };
    const currentPlace = String(this.detailsForm.controls.city.value || '').trim();
    if (overwritePlace || !currentPlace) {
      patch.city = this.getPlaceValue(location);
    }
    this.detailsForm.patchValue(patch);
  }
}

