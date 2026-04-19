import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { API_BASE_URL } from '../../../core/api';

declare global {
  interface Window {
    Cashfree?: (config: { mode: 'sandbox' | 'production' }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget: '_self' | '_blank' | '_modal' }) => Promise<unknown> | unknown;
    };
  }
}

@Component({
  selector: 'app-student-application-payment',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="payment-page">
      <mat-card class="payment-card">
        <div class="payment-header">
          <div>
            <h1>Exam Fee Payment</h1>
            <p>Validate, pay securely with Cashfree, and continue to the printable exam form.</p>
          </div>
          <button mat-stroked-button type="button" [routerLink]="['/app/student/applications', applicationId()]">
            <mat-icon>arrow_back</mat-icon>
            Back to Application
          </button>
        </div>

        @if (loading()) {
          <div class="state-box loading-state">
            <mat-spinner diameter="44"></mat-spinner>
            <div>
              <strong>{{ statusHeading() }}</strong>
              <p>{{ infoMessage() || 'Please wait while the payment flow is being prepared.' }}</p>
            </div>
          </div>
        }

        @if (!loading() && sandboxMode() && !error() && !success()) {
          <div class="state-box loading-state">
            <mat-icon>science</mat-icon>
            <div>
              <strong>Sandbox payment mode</strong>
              <p>{{ infoMessage() }}</p>
            </div>
          </div>

          <div class="action-row">
            <button mat-raised-button color="primary" type="button" (click)="completeSandboxPayment()">
              <mat-icon>science</mat-icon>
              Simulate Success
            </button>
            <button mat-stroked-button type="button" (click)="retry()">
              <mat-icon>refresh</mat-icon>
              Restart Payment
            </button>
          </div>
        }

        @if (!loading() && error()) {
          <div class="state-box error-state">
            <mat-icon>error_outline</mat-icon>
            <div>
              <strong>Payment could not be completed</strong>
              <p>{{ error() }}</p>
            </div>
          </div>

          <div class="action-row">
            <button mat-raised-button color="primary" type="button" (click)="retry()">
              <mat-icon>refresh</mat-icon>
              Retry Payment
            </button>

            @if (sandboxMode()) {
              <button mat-stroked-button type="button" (click)="completeSandboxPayment()">
                <mat-icon>science</mat-icon>
                Simulate Success
              </button>
            }
          </div>
        }

        @if (!loading() && !error() && success()) {
          <div class="state-box success-state">
            <mat-icon>check_circle</mat-icon>
            <div>
              <strong>Payment successful</strong>
              <p>{{ infoMessage() || 'Redirecting to the printable exam form...' }}</p>
            </div>
          </div>
        }

        @if (amountRupees() !== null) {
          <div class="summary-row">
            <span>Payable amount</span>
            <strong>₹ {{ amountRupees() }}</strong>
          </div>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .payment-page {
      padding: 24px 12px;
      display: grid;
      place-items: start center;
    }

    .payment-card {
      width: min(760px, 100%);
      padding: 20px;
      border-radius: 14px;
      border-top: 4px solid #2563eb;
    }

    .payment-header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }

    .payment-header h1 {
      margin: 0 0 6px;
      font-size: 1.35rem;
      color: #0f172a;
    }

    .payment-header p {
      margin: 0;
      color: #475569;
    }

    .state-box {
      display: flex;
      gap: 14px;
      align-items: center;
      border-radius: 12px;
      padding: 16px;
      margin-top: 12px;
    }

    .state-box strong {
      display: block;
      margin-bottom: 4px;
      color: #0f172a;
    }

    .state-box p {
      margin: 0;
      color: #475569;
      line-height: 1.5;
    }

    .loading-state {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
    }

    .error-state {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }

    .error-state mat-icon {
      color: #dc2626;
    }

    .success-state {
      background: #ecfdf5;
      border: 1px solid #bbf7d0;
    }

    .success-state mat-icon {
      color: #059669;
    }

    .action-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 16px;
    }

    .summary-row {
      margin-top: 18px;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 1rem;
      color: #0f172a;
    }

    @media (max-width: 640px) {
      .payment-page {
        padding: 16px 8px;
      }

      .payment-card {
        padding: 16px;
      }

      .action-row button {
        width: 100%;
      }
    }
  `]
})
export class StudentApplicationPaymentComponent implements OnInit {
  readonly applicationId = signal<number | null>(null);
  readonly loading = signal(true);
  readonly success = signal(false);
  readonly error = signal<string | null>(null);
  readonly infoMessage = signal('Preparing secure payment gateway...');
  readonly amountRupees = signal<number | null>(null);
  readonly sandboxMode = signal(false);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  ngOnInit(): void {
    const applicationId = Number(this.route.snapshot.paramMap.get('id'));
    this.applicationId.set(Number.isFinite(applicationId) && applicationId > 0 ? applicationId : null);

    if (!this.applicationId()) {
      this.loading.set(false);
      this.error.set('Invalid application selected for payment.');
      return;
    }

    const paymentStatus = this.route.snapshot.queryParamMap.get('payment_status');
    const orderId = this.route.snapshot.queryParamMap.get('order_id');

    if (paymentStatus) {
      this.handleCashfreeReturn(this.applicationId()!, paymentStatus, orderId);
    } else {
      this.initiatePayment(this.applicationId()!);
    }
  }

  statusHeading(): string {
    if (this.success()) return 'Payment complete';
    return 'Redirecting to payment';
  }

  retry(): void {
    const applicationId = this.applicationId();
    if (!applicationId) return;

    this.router.navigate(['/app/student/applications', applicationId, 'payment']).then(() => {
      if (this.router.url.includes('/payment')) {
        this.initiatePayment(applicationId);
      }
    });
  }

  completeSandboxPayment(): void {
    const applicationId = this.applicationId();
    if (!applicationId) return;

    this.loading.set(true);
    this.error.set(null);
    this.infoMessage.set('Completing sandbox payment and finalizing your application...');

    this.http.post<any>(`${API_BASE_URL}/payments/sandbox/complete/${applicationId}`, {}).subscribe({
      next: () => this.finalizeSubmission(applicationId),
      error: (err: any) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || err?.error?.error || 'Sandbox payment could not be completed.');
      }
    });
  }

  private initiatePayment(applicationId: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);
    this.sandboxMode.set(false);
    this.infoMessage.set('Preparing secure payment gateway...');

    this.http.post<any>(`${API_BASE_URL}/payments/initiate/${applicationId}`, {}).subscribe({
      next: (response: any) => {
        this.amountRupees.set(typeof response?.amountRupees === 'number' ? response.amountRupees : null);

        if (response?.alreadyPaid) {
          this.infoMessage.set('Payment already completed. Opening your printable exam form...');
          this.finalizeSubmission(applicationId);
          return;
        }

        if (response?.sandbox || response?.environment === 'sandbox') {
          this.loading.set(false);
          this.sandboxMode.set(true);
          this.infoMessage.set(response?.message || 'Test payment mode is active. Use the button below to simulate payment success.');
          return;
        }

        if (!response?.paymentSessionId) {
          this.loading.set(false);
          this.error.set('Payment session could not be created. Please try again.');
          return;
        }

        this.launchCashfreeCheckout(response.paymentSessionId, response.environment || 'sandbox');
      },
      error: (err: any) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || err?.error?.error || 'Unable to initiate payment right now.');
      }
    });
  }

  private launchCashfreeCheckout(paymentSessionId: string, environment: string): void {
    if (typeof window === 'undefined' || typeof window.Cashfree !== 'function') {
      this.loading.set(false);
      this.error.set('Cashfree checkout script is not available. Please refresh and try again.');
      return;
    }

    this.infoMessage.set('Redirecting you to Cashfree secure payment gateway...');

    try {
      const cashfree = window.Cashfree({
        mode: environment === 'production' ? 'production' : 'sandbox'
      });

      Promise.resolve(cashfree.checkout({
        paymentSessionId,
        redirectTarget: '_self'
      })).catch((err: any) => {
        this.loading.set(false);
        this.error.set(err?.message || 'Cashfree checkout could not be opened.');
      });
    } catch (err: any) {
      this.loading.set(false);
      this.error.set(err?.message || 'Cashfree checkout could not be opened.');
    }
  }

  private handleCashfreeReturn(applicationId: number, paymentStatus: string, orderId: string | null): void {
    const normalized = String(paymentStatus || '').trim().toUpperCase();

    if (!['PAID', 'SUCCESS', 'COMPLETED'].includes(normalized)) {
      this.loading.set(false);
      this.error.set('Payment was cancelled or failed. You can retry the payment from this page.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.infoMessage.set('Payment received. Finalizing your application...');

    this.http.post<any>(`${API_BASE_URL}/payments/confirm/${applicationId}`, {
      orderId,
      paymentStatus: normalized
    }).subscribe({
      next: (response: any) => {
        if (response?.isPaid) {
          this.finalizeSubmission(applicationId);
          return;
        }

        this.loading.set(false);
        this.error.set('Payment verification is still pending. Please retry in a moment.');
      },
      error: (err: any) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || err?.error?.error || 'Unable to verify payment right now.');
      }
    });
  }

  private finalizeSubmission(applicationId: number): void {
    const submitPayload = {
      applicationId,
      source: 'student-payment-finalization',
      submittedAt: new Date().toISOString()
    };

    this.http.post<any>(`${API_BASE_URL}/applications/${applicationId}/submit`, submitPayload).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
        this.infoMessage.set('Payment successful. Opening the printable exam form...');
        setTimeout(() => {
          this.router.navigate(['/app/student/forms', applicationId, 'print']);
        }, 700);
      },
      error: (err: any) => {
        if (err?.error?.error === 'INVALID_STATE') {
          this.success.set(true);
          this.loading.set(false);
          this.infoMessage.set('Application was already submitted. Opening the printable form...');
          setTimeout(() => {
            this.router.navigate(['/app/student/forms', applicationId, 'print']);
          }, 700);
          return;
        }

        this.loading.set(false);
        this.error.set(err?.error?.message || err?.error?.error || 'Payment was completed, but the application could not be submitted automatically.');
      }
    });
  }
}
