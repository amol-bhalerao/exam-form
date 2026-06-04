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
            <p>Validate, pay securely with Cashfree, and get your printable payment receipt.</p>
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
              <p>{{ infoMessage() || 'Redirecting to your payment receipt...' }}</p>
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
      this.error.set('पेमेंटसाठी निवडलेला अर्ज वैध नाही.');
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
        this.error.set(this.toMarathiPaymentError(err, 'चाचणी पेमेंट पूर्ण करताना अडचण आली.'));
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
          this.infoMessage.set('Payment already completed. Opening your payment receipt...');
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
          this.error.set('पेमेंट सत्र तयार झाले नाही. कृपया पुन्हा प्रयत्न करा.');
          return;
        }

        this.launchCashfreeCheckout(response.paymentSessionId, response.environment || 'sandbox');
      },
      error: (err: any) => {
        this.loading.set(false);
        this.error.set(this.toMarathiPaymentError(err, 'आत्ता पेमेंट सुरू करता आले नाही.'));
      }
    });
  }

  private launchCashfreeCheckout(paymentSessionId: string, environment: string): void {
    if (typeof window === 'undefined' || typeof window.Cashfree !== 'function') {
      this.loading.set(false);
      this.error.set('Cashfree पेमेंट स्क्रिप्ट उपलब्ध नाही. कृपया पेज रिफ्रेश करून पुन्हा प्रयत्न करा.');
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
        this.error.set(this.toMarathiPaymentError(err, 'Cashfree पेमेंट विंडो उघडता आली नाही.'));
      });
    } catch (err: any) {
      this.loading.set(false);
      this.error.set(this.toMarathiPaymentError(err, 'Cashfree पेमेंट विंडो उघडता आली नाही.'));
    }
  }

  private handleCashfreeReturn(applicationId: number, paymentStatus: string, orderId: string | null): void {
    const normalized = String(paymentStatus || '').trim().toUpperCase();

    if (!['PAID', 'SUCCESS', 'COMPLETED'].includes(normalized)) {
      this.loading.set(false);
      this.error.set('पेमेंट रद्द झाले किंवा अयशस्वी झाले. या पेजवरून पुन्हा प्रयत्न करू शकता.');
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
        this.error.set('पेमेंट पडताळणी अजून प्रलंबित आहे. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.');
      },
      error: (err: any) => {
        this.loading.set(false);
        this.error.set(this.toMarathiPaymentError(err, 'आत्ता पेमेंट पडताळणी करता आली नाही.'));
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
        this.infoMessage.set('Payment successful. Opening your printable payment receipt...');
        setTimeout(() => {
          this.router.navigate(['/app/student/applications', applicationId, 'receipt'], {
            queryParams: { autoprint: 1 }
          });
        }, 700);
      },
      error: (err: any) => {
        if (err?.error?.error === 'INVALID_STATE') {
          this.success.set(true);
          this.loading.set(false);
          this.infoMessage.set('Application was already submitted. Opening your payment receipt...');
          setTimeout(() => {
            this.router.navigate(['/app/student/applications', applicationId, 'receipt']);
          }, 700);
          return;
        }

        if (err?.error?.error === 'INVALID_SUBJECT_CATEGORY') {
          this.success.set(true);
          this.loading.set(false);
          this.infoMessage.set('Payment completed. Application submission needs subject correction. Opening your payment receipt...');
          setTimeout(() => {
            this.router.navigate(['/app/student/applications', applicationId, 'receipt']);
          }, 700);
          return;
        }

        this.loading.set(false);
        this.error.set(this.toMarathiPaymentError(err, 'पेमेंट पूर्ण झाले, पण अर्ज आपोआप सबमिट करता आला नाही.'));
      }
    });
  }

  private toMarathiPaymentError(err: any, fallback: string): string {
    const code = String(err?.error?.error || '').trim().toUpperCase();
    const rawMessage = String(err?.error?.message || err?.message || err?.error || '').trim();
    const messages: Record<string, string> = {
      PAYMENT_GATEWAY_UNAVAILABLE: 'पेमेंट सेवा सध्या उपलब्ध नाही. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.',
      APPLICATION_NOT_FOUND: 'पेमेंटसाठी अर्ज सापडला नाही.',
      PAYMENT_NOT_ALLOWED_FOR_STATUS: 'या अर्जाच्या सद्य स्थितीत पेमेंट करता येणार नाही.',
      PAYMENT_REQUIRED: 'ही कृती करण्यापूर्वी पेमेंट पूर्ण करणे आवश्यक आहे.',
      INVALID_STATE: 'या स्थितीत पेमेंट प्रक्रिया करता येणार नाही.',
      SUBJECTS_REQUIRED: 'पेमेंटपूर्वी किमान एक विषय निवडणे आवश्यक आहे.',
      INVALID_SUBJECT_CATEGORY: 'विषय निवडीत त्रुटी आहे. कृपया अर्जातील विषय पुन्हा तपासा.',
      VALIDATION_ERROR: 'कृपया अर्जातील आवश्यक माहिती योग्य स्वरूपात भरा.',
      INTERNAL_ERROR: 'सर्व्हरमध्ये अडचण आली. कृपया पुन्हा प्रयत्न करा.'
    };

    if (messages[code]) return messages[code];
    if (/cashfree|gateway/i.test(rawMessage)) return messages['PAYMENT_GATEWAY_UNAVAILABLE'];
    if (/payment/i.test(rawMessage)) return messages['PAYMENT_REQUIRED'];
    if (/subject/i.test(rawMessage)) return messages['SUBJECTS_REQUIRED'];
    if (/validation|required|invalid/i.test(rawMessage)) return messages['VALIDATION_ERROR'];
    return fallback;
  }
}
