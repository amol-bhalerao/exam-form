import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { DatePipe, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';

import { API_BASE_URL } from '../../../core/api';
import { BrandingService } from '../../../core/branding.service';

@Component({
  selector: 'app-student-form-print',
  standalone: true,
  imports: [DatePipe, MatButtonModule],
  template: `
    @if (showActions()) {
      <div class="no-print actions">
        <button mat-stroked-button type="button" (click)="goBack()">Back</button>
        <button mat-flat-button color="primary" (click)="print()">Print Form</button>
      </div>
    }

    @if (application()) {
      <div class="page">
        <div class="document-shell official-sheet">
          <header class="document-header">
            <div class="board-head compact-head">
              <div class="head-copy">
                <div class="board-name">MAHARASHTRA HSC EXAMINATION PORTAL</div>
                <h1>HIGHER SECONDARY CERTIFICATE EXAMINATION APPLICATION FORM </h1>
                <hr>
                <h1>{{ valueOrDash(a().exam?.name, 'HSC Examination') }} {{ valueOrDash(a().exam?.session) }} {{ valueOrDash(a().exam?.academicYear, '') }}</h1>
                <h1>{{ instituteName() }} ( {{ indexNoValue() }} )</h1>
                
                <div class="institute-subline">{{ instituteAddress() }}</div>
                <div class="institute-meta-row">
                  <span><strong>Index No.:</strong> {{ a().institute?.code || a().institute?.collegeNo || '—' }}</span>
                  <span><strong>UDISE No.:</strong> {{ udiseNoValue() }}</span>
                  <span><strong>Centre No.:</strong> {{ centreNoValue() }}</span>
                  <span><strong>Stream:</strong> {{ streamLabel() }}</span>
                </div>
              </div>
            </div>
            <aside class="header-side">
              <div class="meta-row"><span>Application No</span><strong>{{ a().applicationNo || '—' }}</strong></div>
              <div class="meta-row"><span>Status</span><strong class="status-chip" [attr.data-tone]="statusTone()">{{ statusLabel() }}</strong></div>
              <div class="meta-row"><span>Printed on</span><strong>{{ printedAt | date:'dd/MM/yyyy' }}</strong></div>
              <div class="meta-row"><span>Candidate Type</span><strong>{{ candidateTypeLabel() }}</strong></div>
            </aside>
          </header>


          <section class="section-card">
            <div class="section-title">1. Candidate Personal Particulars</div>
            <div class="detail-grid" [class.grid-3]="useThreeColumnDetails()" [class.grid-4]="!useThreeColumnDetails()">
              <div class="detail-item">
                <label>Surname</label>
                <div>{{ valueOrDash(s().lastName) }}</div>
              </div>
              <div class="detail-item">
                <label>First Name</label>
                <div>{{ valueOrDash(s().firstName) }}</div>
              </div>
              <div class="detail-item">
                <label>Middle Name</label>
                <div>{{ valueOrDash(s().middleName) }}</div>
              </div>
              <div class="detail-item">
                <label>Mother Name</label>
                <div>{{ valueOrDash(s().motherName) }}</div>
              </div>

              
              
              <div class="detail-item">
                <label>Aadhaar No</label>
                <div>{{ valueOrDash(s().aadhaar) }}</div>
              </div>
              <div class="detail-item">
                <label>Student Saral ID</label>
                <div>{{ studentSaralIdValue() }}</div>
              </div>
              <div class="detail-item">
                <label>APAAR ID</label>
                <div>{{ valueOrDash(s().apaarId) }}</div>
              </div>
              <div class="detail-item">
                <label>Mobile No</label>
                <div>{{ valueOrDash(s().mobile) }}</div>
              </div>
              <div class="detail-item">
                <label>Date of Birth</label>
                <div>{{ s().dob ? (s().dob | date:'dd MMM, yyyy') : '—' }}</div>
              </div>
              <div class="detail-item">
                <label>Gender</label>
                <div>{{ genderLabel() }}</div>
              </div>
              
              <div class="detail-item">
                <label>Email</label>
                <div>{{ valueOrDash(s().email || a().user?.email) }}</div>
              </div>
              <div class="detail-item">
                <label>Residential Address</label>
                <div>{{ valueOrDash(s().address) }}</div>
              </div>
            
            </div>
          </section>

          <section class="section-card">
            <div class="section-title">2. Academic & Reservation Details</div>
            <div class="detail-grid compact-grid" [class.grid-3]="useThreeColumnDetails()" [class.grid-4]="!useThreeColumnDetails()">
              <div class="detail-item">
                <label>Stream</label>
                <div>{{ streamLabel() }}</div>
              </div>
              <div class="detail-item">
                <label>Minority Religion</label>
                <div>{{ religionLabel() }}</div>
              </div>
              <div class="detail-item">
                <label>Category</label>
                <div>{{ categoryLabel() }}</div>
              </div>
              <div class="detail-item">
                <label>Medium</label>
                <div>{{ mediumLabel() }}</div>
              </div>
              <div class="detail-item">
                <label>Divyang Code</label>
                <div>{{ s().divyangCode ? s().divyangCode : 'No' }}</div>
              </div>
              <div class="detail-item">
                <label>SSC from Maharashtra</label>
                <div>{{ yesNoOrDash(a().sscPassedFromMaharashtra) }}</div>
              </div>
              <div class="detail-item">
                <label>Eligibility Certificate</label>
                <div>{{ yesNoOrDash(a().eligibilityCertIssued) }}</div>
              </div>
              <div class="detail-item">
                <label>Certificate No</label>
                <div>{{ valueOrDash(a().eligibilityCertNo) }}</div>
              </div>
            </div>
          </section>

          <section class="section-card">
            <div class="section-title">3. Subject Details</div>
            <div class="table-wrap">
              <table class="subject-table" [class.subject-table-dense]="isDenseSubjectTable()">
                <thead>
                  <tr>
                    <th style="width: 7%;">Sr</th>
                    <th style="width: 12%;">Sub. Code</th>
                    <th>Subject Name</th>
                    <th style="width: 20%;">Sub. Category</th>
                    <th style="width: 15%;">Ans. Lang</th>
                  </tr>
                </thead>
                <tbody>
                  @for (sub of (a().subjects ?? []); track sub.id) {
                    <tr>
                      <td class="cell-center">{{ $index + 1 }}</td>
                      <td>{{ valueOrDash(sub.subject?.code) }}</td>
                      <td class="subject-name-cell">{{ valueOrDash(sub.subject?.name) }}</td>
                      <td>{{ valueOrDash(sub.subject?.category, 'General') }}</td>
                      <td class="cell-center">{{ answerLanguageForPrint(sub) }}</td>
                    </tr>
                  }
                  @if (!(a().subjects?.length)) {
                    <tr>
                      <td colspan="5" class="muted center empty-table">No subjects selected yet</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          @if (hasOtherDetails()) {
            <section class="section-card">
              <div class="section-title">4. Previous Exam Details</div>
              <div class="detail-grid grid-4 compact-grid">
                <div class="detail-item">
                  <label>Exemptions Claimed</label>
                  <div>{{ a().totalExemptionsClaimed ?? ((a().exemptedSubjects?.length ?? 0) || 0) }}</div>
                </div>
                <div class="detail-item">
                  <label>Previous Attempt</label>
                  <div>{{ valueOrDash(a().lastExamMonth) }} {{ valueOrDash(a().lastExamYear, '') }} / {{ valueOrDash(a().lastExamSeatNo, 'No seat no') }}</div>
                </div>
                <div class="detail-item">
                  <label>Enrollment Cert</label>
                  <div>{{ valueOrDash(a().enrollmentCertMonth, '—') }} / {{ valueOrDash(a().enrollmentCertYear, '—') }} / {{ valueOrDash(a().enrollmentNo, '—') }}</div>
                </div>
                <div class="detail-item">
                  <label>Special Remark</label>
                  <div>{{ isBacklogCandidate() ? 'Backlog / Repeater candidate' : 'Regular / Fresh candidate' }}</div>
                </div>
              </div>

              @if (isBacklogCandidate()) {
                <table class="subject-table mini-table">
                  <thead>
                    <tr>
                      <th>SR. No</th>
                      <th>Sub. Code</th>
                      <th>Subject Name</th>
                      <th>Seat No</th>
                      <th>Month</th>
                      <th>Year</th>
                      <th>Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (e of (a().exemptedSubjects ?? []); track e.id) {
                      <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>{{ valueOrDash(e.subjectCode) }}</td>
                        <td>{{ valueOrDash(e.subjectName) }}</td>
                        
                        <td>{{ valueOrDash(e.seatNo) }}</td>
                        <td>{{ valueOrDash(e.month) }}</td>
                        <td>{{ valueOrDash(e.year) }}</td>
                        <td>{{ valueOrDash(e.marksObt) }}</td>
                      </tr>
                    }
                    @if (!(a().exemptedSubjects?.length)) {
                      <tr>
                        <td colspan="6" class="muted center">No exempted subject details provided</td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </section>
          }

          <section class="bottom-grid">
            <div class="declaration-box">
              <div class="section-title small-title">5. Declaration</div>
              <p>
                I hereby declare that the information furnished by me in this form is true and correct to the best of my knowledge.
                            </p>

             

              <div class="note-line">
                Reference: <strong>{{ a().applicationNo || applicationSerialValue() }}</strong>
              </div>
              <div class="sign-box declaration-signature-box">
                  <div class="asset-caption">Candidate Signature</div>
                  @if (signatureUrl()) {
                    <img [src]="signatureUrl()" alt="Student signature" class="asset-image signature-image declaration-signature-image" loading="eager" (error)="onSignatureLoadError()" />
                  } @else {
                    <span class="placeholder-label">Candidate Signature</span>
                  }
                </div>
            </div>

            <div class="photo-box declaration-photo-box standalone-photo-box">
              <div class="asset-caption">Candidate Photograph</div>
              @if (photoUrl()) {
                <img [src]="photoUrl()" alt="Student photograph" class="asset-image photo-image declaration-photo-image" loading="eager" (error)="onPhotoLoadError()" />
              } @else {
                <span class="placeholder-label">Student Photo</span>
              }
            </div>

            <div class="sign-box signature-cell principal-sign-box principal-seal-box">
                <span class="placeholder-label">Principal Seal & Signature</span>
            </div>
          </section>

          <footer class="document-footer">
            <span>This is a system-generated official print view for A4 paper.</span>
            <span>{{ branding.getWebsite() }}</span>
          </footer>
        </div>
      </div>
    } @else {
      <div class="page loading-page">Loading printable exam form…</div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        background: #e9edf2;
        font-family: Arial, 'Helvetica Neue', sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .actions {
        width: 210mm;
        margin: 12px auto 0;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .page {
        width: 210mm;
        min-height: 297mm;
        margin: 6px auto 14px;
        background: #fff;
        color: #000;
        padding: 3mm;
        box-sizing: border-box;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        overflow: visible;
      }

      .document-shell {
        min-height: 100%;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .official-sheet {
        border: 1.5px solid #000;
        padding: 2.5mm;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
      }

      .document-header {
        display: grid;
        grid-template-columns: 3fr 1fr;
        gap: 4px;
        align-items: stretch;
      }

      .board-head,
      .header-side,
      .section-card,
      .declaration-box,
      .sign-box,
      .photo-box {
        border: 1px solid #000;
        background: #fff;
      }

      .board-head {
        display: grid;
        grid-template-columns: 1fr;
        gap: 4px;
        padding: 4px 6px;
        align-items: start;
      }

      .compact-head {
        min-height: auto;
      }

      .board-name {
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        text-align: center;
      }

      .head-copy h1,
      .head-copy h2 {
        margin: 2px 0;
        text-align: center;
        font-weight: 700;
      }

      .head-copy h1 {
        font-size: 11.5px;
        line-height: 1.15;
        margin: 1px 0;
      }

      .head-copy h2 {
        font-size: 10px;
        line-height: 1.1;
      }

      .head-copy hr {
        margin: 2px 0;
        border: 0;
        border-top: 1px solid #000;
      }

      .institute-subline {
        margin-top: 2px;
        font-size: 7.8px;
        text-align: center;
      }

      .institute-meta-row {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 2px 10px;
        margin-top: 3px;
        font-size: 9px;
        text-align: center;
      }

      .institute-meta-row span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .header-side {
        display: grid;
        border: 1px solid #000;
      }

      .meta-row {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        padding: 4px 6px;
        border-top: 1px solid #000;
        font-size: 8px;
        align-items: center;
      }

      .meta-row:first-child {
        border-top: 0;
      }

      .meta-row span {
        font-weight: 400;
      }

      .meta-row strong {
        text-align: right;
      }

      .status-chip {
        display: inline-block;
        padding: 1px 6px;
        border: 1px solid #000;
        font-size: 7px;
        text-transform: uppercase;
        background: #f3f4f6;
      }

      .detail-item label {
        display: block;
        font-size: 7.8px;
        font-weight: 400;
        text-transform: none;
        margin-bottom: 2px;
        letter-spacing: 0;
        color: #111827;
      }

      .section-card {
        padding: 0;
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .section-title {
        padding: 2px 5px;
        font-size: 8px;
        font-weight: 700;
        text-transform: uppercase;
        border-bottom: 1px solid #000;
        background: #f3f4f6;
      }

      .small-title {
        margin: 0;
      }

      .detail-grid {
        display: grid;
        gap: 6px;
        padding: 4px;
      }

      .grid-4 {
        grid-template-columns: repeat(4, 1fr);
      }

      .grid-3 {
        grid-template-columns: repeat(3, 1fr);
      }

      .detail-item {
        position: relative;
        padding: 9px 6px 4px;
        min-height: 30px;
        border: 1px solid #000;
        background: #fff;
      }

      .detail-item div {
        font-size: 9.2px;
        line-height: 1.25;
        word-break: break-word;
        overflow-wrap: anywhere;
        font-weight: 700;
        color: #000;
        text-align: center;
      }

      .detail-item label {
        position: absolute;
        top: -6px;
        left: 6px;
        margin: 0;
        padding: 0 4px;
        border: 1px solid #000;
        background: #fff;
        color: #111827;
        line-height: 1.05;
      }

      .table-wrap {
        width: 100%;
        overflow: hidden;
        border-top: 0;
      }

      .subject-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        font-size: 7.5px;
      }

      .subject-table th,
      .subject-table td {
        border: 1px solid #000;
        padding: 2px 3px;
        vertical-align: middle;
        line-height: 1.15;
        overflow-wrap: anywhere;
        text-align: center;
      }

      .subject-table tbody tr {
        height: 18px;
      }

      .subject-table.subject-table-dense {
        font-size: 7px;
      }

      .subject-table.subject-table-dense th,
      .subject-table.subject-table-dense td {
        padding: 1px 2px;
        line-height: 1.05;
      }

      .subject-table.subject-table-dense tbody tr {
        height: 15px;
      }

      .subject-table thead th {
        background: linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%);
        font-weight: 400;
        text-align: center;
        letter-spacing: 0.01em;
      }

      .subject-table tbody tr:nth-child(even) {
        background: #fafafa;
      }

      .subject-table tbody td {
        font-weight: 700;
        color: #000;
      }

      .subject-name-cell {
        font-weight: 700;
        color: #111827;
        word-break: break-word;
      }

      .cell-center {
        text-align: center;
        vertical-align: middle;
      }

      .empty-table {
        padding: 6px 4px !important;
      }

      .mini-table {
        margin-top: 0;
        border-top: 0;
      }

      .bottom-grid {
        display: grid;
        grid-template-columns: 70% 15% 15%;
        gap: 4px;
        margin-top: auto;
        align-items: stretch;
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .declaration-box {
        padding: 5px 6px;
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
      }

      .declaration-box p {
        margin: 0;
        font-size: 7.8px;
        line-height: 1.3;
        font-weight: 700;
        text-align: center;
      }

      .note-line {
        margin-top: 4px;
        font-size: 7.6px;
        text-align: center;
      }

      .declaration-media-row {
        margin-top: 5px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        align-items: end;
      }

      .declaration-photo-box {
        min-height: 54px;
      }

      .standalone-photo-box {
        min-height: 70px;
        height: 100%;
        width: 100%;
      }

      .declaration-signature-box {
        min-height: 44px;
        margin-top: auto;
        align-items: end;
        border: none;
      }

      .asset-caption {
        font-size: 6.6px;
        font-weight: 700;
        letter-spacing: 0.01em;
        text-transform: uppercase;
      }

      .principal-sign-box {
        min-height: 70px;
        width: 100%;
      }

      .principal-seal-box {
        justify-content: flex-end;
        align-items: center;
        padding: 3px 4px;
      }

      .sign-box,
      .photo-box {
        display: flex;
        flex-direction: column;
        align-items: end;
        justify-content: center;
        gap: 2px;
        padding: 2px;
        font-size: 7.2px;
        font-weight: 700;
        text-align: center;
        overflow: hidden;
        background: #fff;
      }

      .placeholder-label {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        padding: 2px;
        line-height: 1.2;
      }

      .asset-image {
        width: 100%;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        display: block;
      }

      .photo-image {
        object-fit: contain;
        object-position: center;
        background: #fff;
      }

      .declaration-photo-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .signature-image {
        object-fit: contain;
        object-position: center;
        height: 50%;
        padding: 2px;
        border: none;
      }

      .declaration-signature-image {
        width: 30%;
        height: 100%;
      }

      .signature-cell {
        min-height: 48px;
      }

      .sign-box {
        min-height: 48px;
      }

      .document-footer {
        margin-top: 2px;
        display: flex;
        justify-content: space-between;
        gap: 8px;
        border-top: 1px solid #000;
        padding-top: 3px;
        font-size: 7px;
        font-weight: 700;
      }

      .center {
        text-align: center;
      }

      .muted {
        color: #444;
      }

      .loading-page {
        display: grid;
        place-items: center;
        font-weight: 600;
      }

      @page {
        size: A4 portrait;
        margin: 5mm;
      }

      @media (max-width: 900px) {
        .page {
          width: 100%;
          min-height: auto;
          margin: 0;
          padding: 10px;
        }

        .document-header,
        .grid-4 {
          grid-template-columns: repeat(2, 1fr);
        }

        .grid-3 {
          grid-template-columns: repeat(2, 1fr);
        }

        .standalone-photo-box {
          min-height: 64px;
        }

        .declaration-photo-box {
          min-height: 50px;
        }

        .declaration-signature-box {
          min-height: 40px;
        }

        .principal-sign-box,
        .signature-cell,
        .sign-box {
          min-height: 44px;
        }

        .bottom-grid {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 520px) {
        .page {
          padding: 8px;
        }

        .document-header,
        .grid-4,
        .grid-3 {
          grid-template-columns: 1fr;
        }

        .declaration-media-row {
          grid-template-columns: 1fr;
        }

        .declaration-photo-box {
          min-height: 46px;
        }

        .standalone-photo-box {
          min-height: 58px;
        }

        .declaration-signature-box {
          min-height: 36px;
        }

        .principal-sign-box,
        .signature-cell,
        .sign-box {
          min-height: 42px;
        }

        .bottom-grid {
          grid-template-columns: 1fr;
        }

        .detail-item,
        .detail-item:nth-child(4n) {
          border-right: 1px solid #000;
        }
      }

      @media print {
        :host {
          background: #fff;
          display: block;
        }

        .no-print {
          display: none !important;
        }

        .page {
          width: 100%;
          min-height: calc(297mm - 10mm);
          margin: 0;
          padding: 0;
          box-shadow: none;
          display: block;
        }

        .official-sheet {
          border: 1.5px solid #000;
          padding: 2.5mm;
          min-height: calc(297mm - 10mm);
        }

        .document-header {
          grid-template-columns: 1.7fr 1fr !important;
        }

        .grid-4 {
          grid-template-columns: repeat(4, 1fr) !important;
        }

        .grid-3 {
          grid-template-columns: repeat(3, 1fr) !important;
        }

        .bottom-grid {
          grid-template-columns: 70% 15% 15% !important;
        }

        .subject-table {
          font-size: 7px !important;
        }

        .detail-item {
          min-height: 28px !important;
          padding: 8px 5px 3px !important;
        }

        .detail-item label {
          font-size: 7.6px !important;
        }

        .detail-item div {
          font-size: 8.8px !important;
          line-height: 1.2 !important;
        }

        .subject-table th,
        .subject-table td {
          padding: 1px 2px !important;
          line-height: 1.05 !important;
        }

        .subject-table tbody tr {
          height: 15px !important;
        }

        .standalone-photo-box {
          min-height: 14mm !important;
        }

        .declaration-photo-box {
          min-height: 11.5mm !important;
        }

        .declaration-signature-box {
          min-height: 9mm !important;
        }

        .principal-sign-box,
        .signature-cell,
        .sign-box {
          min-height: 9.5mm !important;
        }

        .section-card,
        .bottom-grid,
        .declaration-box,
        .document-footer,
        .subject-table tr,
        .subject-table td,
        .subject-table th {
          break-inside: avoid;
          page-break-inside: avoid;
        }
      }
    `
  ]
})
export class StudentFormPrintComponent implements OnInit {
  @Input() applicationId: number | null = null;
  @Input() hideActionsInput = false;
  @Input() embeddedMode = false;

  readonly application = signal<any | null>(null);
  readonly studentProfile = signal<any | null>(null);
  readonly printedAt = new Date();
  readonly branding = inject(BrandingService);
  readonly photoLoadMode = signal<'normalized' | 'original' | 'failed'>('normalized');
  readonly signatureLoadMode = signal<'normalized' | 'original' | 'failed'>('normalized');

  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly location = inject(Location);
  private autoPrint = false;
  private closeAfterPrint = false;
  private hideActions = false;
  private autoPrintTriggered = false;

  ngOnInit() {
    const routeId = Number(this.route.snapshot.paramMap.get('id'));
    const id = this.applicationId && this.applicationId > 0 ? this.applicationId : routeId;
    if (!id || Number.isNaN(id)) return;

    const query = this.route.snapshot.queryParamMap;
    this.autoPrint = query.get('autoprint') === '1';
    this.closeAfterPrint = query.get('closeAfterPrint') === '1';
    this.hideActions = this.hideActionsInput || query.get('hideActions') === '1';

    if (this.closeAfterPrint) {
      window.addEventListener('afterprint', () => window.close());
    }

    this.http.get<{ application: any }>(`${API_BASE_URL}/applications/${id}`).subscribe((r: any) => {
      const application = r?.application
        ? {
          ...r.application,
          student: r.application.student
            ? {
              ...r.application.student,
              photoUrl: this.withCacheBust(r.application.student.photoUrl),
              signatureUrl: this.withCacheBust(r.application.student.signatureUrl)
            }
            : null
        }
        : null;

      this.application.set(application);
      this.photoLoadMode.set('normalized');
      this.signatureLoadMode.set('normalized');
      this.triggerAutoPrintIfNeeded();
    });

    if (!this.embeddedMode) {
      this.http.get<{ student?: any }>(`${API_BASE_URL}/me`).subscribe({
        next: (r: any) => {
          if (!r?.student) return;
          this.studentProfile.set({
            ...r.student,
            photoUrl: this.withCacheBust(r.student.photoUrl),
            signatureUrl: this.withCacheBust(r.student.signatureUrl)
          });
          this.photoLoadMode.set('normalized');
          this.signatureLoadMode.set('normalized');
        },
        error: () => {
          // Keep printable form working for institute/board roles; application student data remains the fallback.
        }
      });
    }
  }

  showActions() {
    return !this.hideActions;
  }

  private triggerAutoPrintIfNeeded() {
    if (!this.autoPrint || this.autoPrintTriggered || !this.application()) return;
    this.autoPrintTriggered = true;
    setTimeout(() => {
      this.print();
    }, 250);
  }

  a() {
    return this.application() ?? {};
  }

  s() {
    const appStudent = this.application()?.student ?? {};
    const profileStudent = this.studentProfile() ?? {};

    return {
      ...appStudent,
      ...profileStudent,
      photoUrl: profileStudent.photoUrl || appStudent.photoUrl || null,
      signatureUrl: profileStudent.signatureUrl || appStudent.signatureUrl || null
    };
  }

  photoUrl() {
    const raw = this.s().photoUrl;
    if (!raw || this.photoLoadMode() === 'failed') return null;
    return this.photoLoadMode() === 'original'
      ? this.withCacheBustOriginal(raw)
      : this.withCacheBust(raw);
  }

  signatureUrl() {
    const raw = this.s().signatureUrl;
    if (!raw || this.signatureLoadMode() === 'failed') return null;
    return this.signatureLoadMode() === 'original'
      ? this.withCacheBustOriginal(raw)
      : this.withCacheBust(raw);
  }

  onPhotoLoadError() {
    if (this.photoLoadMode() === 'normalized') {
      const raw = this.s().photoUrl;
      if (!raw) {
        this.photoLoadMode.set('failed');
        return;
      }
      const normalized = this.withCacheBust(raw);
      const original = this.withCacheBustOriginal(raw);
      this.photoLoadMode.set(normalized !== original ? 'original' : 'failed');
      return;
    }
    this.photoLoadMode.set('failed');
  }

  onSignatureLoadError() {
    if (this.signatureLoadMode() === 'normalized') {
      const raw = this.s().signatureUrl;
      if (!raw) {
        this.signatureLoadMode.set('failed');
        return;
      }
      const normalized = this.withCacheBust(raw);
      const original = this.withCacheBustOriginal(raw);
      this.signatureLoadMode.set(normalized !== original ? 'original' : 'failed');
      return;
    }
    this.signatureLoadMode.set('failed');
  }

  private withCacheBust(url: unknown) {
    if (!url) return null;
    const normalized = this.normalizeAssetUrl(url);
    if (!normalized) return null;

    const value = String(normalized).trim();
    if (!value) return null;

    const version = `v=${Date.now()}`;
    if (/([?&])v=/.test(value)) {
      return value.replace(/([?&])v=[^&]*/i, `$1${version}`);
    }

    return `${value}${value.includes('?') ? '&' : '?'}${version}`;
  }

  private withCacheBustOriginal(url: unknown) {
    if (!url) return null;
    const value = String(url).trim();
    if (!value) return null;

    const version = `v=${Date.now()}`;
    if (/([?&])v=/.test(value)) {
      return value.replace(/([?&])v=[^&]*/i, `$1${version}`);
    }
    return `${value}${value.includes('?') ? '&' : '?'}${version}`;
  }

  private normalizeAssetUrl(url: unknown) {
    if (!url) return null;

    const value = String(url).trim();
    if (!value) return null;

    try {
      const apiOrigin = new URL(API_BASE_URL, window.location.origin).origin;

      // If backend returns absolute upload URL from another host, prefer the current API host
      // so local/dev print uses local assets.
      if (/^https?:\/\//i.test(value)) {
        const parsed = new URL(value);
        if (parsed.pathname.startsWith('/uploads/')) {
          return `${apiOrigin}${parsed.pathname}${parsed.search || ''}`;
        }
        return value;
      }

      if (/^(data:|blob:)/i.test(value)) {
        return value;
      }

      const normalizedPath = value.startsWith('/') ? value : `/${value}`;
      return `${apiOrigin}${normalizedPath}`;
    } catch {
      return value;
    }
  }

  private waitForImage(selector: string, timeoutMs = 3000): Promise<void> {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLImageElement)) {
        resolve();
        return;
      }

      if (element.complete && element.naturalWidth > 0) {
        resolve();
        return;
      }

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        element.removeEventListener('load', finish);
        element.removeEventListener('error', finish);
        resolve();
      };

      element.addEventListener('load', finish, { once: true });
      element.addEventListener('error', finish, { once: true });
      window.setTimeout(finish, timeoutMs);
    });
  }

  valueOrDash(value: unknown, fallback = '—') {
    if (value === null || value === undefined || value === '') return fallback;
    return String(value);
  }

  indexNoValue() {
    return this.a().indexNo || this.a().institute?.collegeNo || this.a().institute?.code || '—';
  }

  udiseNoValue() {
    return this.a().udiseNo || this.a().institute?.udiseNo || '—';
  }

  studentSaralIdValue() {
    return this.a().studentSaralId || this.s().studentSaralId || this.s().apaarId || '—';
  }

  applicationSerialValue() {
    return this.a().applSrNo || '—';
  }

  answerLanguageForPrint(subjectRow: any) {
    const direct = this.normalizeForCompare(subjectRow?.langOfAnsCode || subjectRow?.answerLanguageCode);
    if (direct) return this.formatLanguageCode(direct);

    const mapped = this.normalizeForCompare(subjectRow?.subject?.answerLanguageCode);
    if (mapped) return this.formatLanguageCode(mapped);

    const medium = this.normalizeForCompare(this.s().mediumCode);
    if (medium) return this.formatLanguageCode(medium);

    return '—';
  }

  showApplicationSerial() {
    const serial = this.normalizeForCompare(this.a().applSrNo);
    const applicationNo = this.normalizeForCompare(this.a().applicationNo);
    if (!serial || !applicationNo) return true;
    return serial !== applicationNo;
  }

  private normalizeForCompare(value: unknown) {
    return String(value || '').trim().toLowerCase();
  }

  centreNoValue() {
    return this.a().centreNo || this.a().institute?.code || this.a().institute?.collegeNo || '—';
  }

  instituteName() {
    return this.a().institute?.name || 'Institute not assigned';
  }

  instituteAddress() {
    const institute = this.a().institute || {};
    return [institute.address, institute.city, institute.district, institute.state].filter(Boolean).join(', ') || '—';
  }

  examDisplayTitle() {
    const exam = this.a().exam || {};
    return [exam.name || 'HSC Examination : ', exam.session, exam.academicYear].filter(Boolean).join(' • ');
  }

  statusLabel() {
    return String(this.a().status || 'DRAFT').replaceAll('_', ' ');
  }

  statusTone() {
    const status = String(this.a().status || '').toUpperCase();
    if (['SUBMITTED', 'BOARD_APPROVED', 'INSTITUTE_VERIFIED'].includes(status)) return 'success';
    if (['REJECTED_BY_INSTITUTE', 'REJECTED_BY_BOARD'].includes(status)) return 'warning';
    return 'progress';
  }

  candidateTypeLabel() {
    const mapping: Record<string, string> = {
      REGULAR: 'Fresh / Regular',
      BACKLOG: 'Backlog',
      REPEATER: 'Repeater',
      ATKT: 'ATKT',
      IMPROVEMENT: 'Improvement',
      PRIVATE: 'Private'
    };
    return mapping[this.a().candidateType] || this.a().candidateType || '—';
  }

  streamLabel() {
    const mapping: Record<string, string> = {
      '1': 'Science',
      '2': 'Arts',
      '3': 'Commerce',
      '4': 'Vocational',
      '5': 'Technology Science',
      SCIENCE: 'Science',
      ARTS: 'Arts',
      COMMERCE: 'Commerce',
      VOCATIONAL: 'Vocational',
      TECHNOLOGY: 'Technology Science'
    };
    const value = String(this.s().streamCode || '').toUpperCase();
    return mapping[value] || this.valueOrDash(this.s().streamCode);
  }

  genderLabel() {
    const value = String(this.s().gender || '').toUpperCase();
    const mapping: Record<string, string> = {
      MALE: 'Male',
      FEMALE: 'Female',
      OTHER: 'Other',
      TRANSGENDER: 'Other'
    };
    return mapping[value] || this.valueOrDash(this.s().gender);
  }

  religionLabel() {
    const value = String(this.s().minorityReligionCode || '').toUpperCase();
    const mapping: Record<string, string> = {
      HINDU_NON_MINORITY: 'Hindu & Other Non-Minority',
      MUSLIM: 'Muslim',
      CHRISTIAN: 'Christian',
      BUDDHIST: 'Buddhist',
      SIKH: 'Sikh',
      JAIN: 'Jain',
      PARSI: 'Parsi',
      JEWISH: 'Jewish',
      OTHER: 'Other'
    };
    return mapping[value] || this.valueOrDash(this.s().minorityReligionCode);
  }

  categoryLabel() {
    const value = String(this.s().categoryCode || '').toUpperCase();
    const mapping: Record<string, string> = {
      GEN: 'Open',
      GENERAL: 'Open',
      OPEN: 'Open',
      SC: 'Scheduled Caste (SC)',
      ST: 'Scheduled Tribe (ST)',
      OBC: 'OBC',
      SBC: 'SBC',
      SEBC: 'SEBC',
      VJ: 'VJ/DT (VJ-A)',
      VJA: 'VJ/DT (VJ-A)',
      NT: 'Nomadic Tribe (NT)',
      NTB: 'Nomadic Tribe (NT-B)',
      NTC: 'Nomadic Tribe (NT-C)',
      NTD: 'Nomadic Tribe (NT-D)',
      EWS: 'EWS'
    };
    return mapping[value] || this.valueOrDash(this.s().categoryCode);
  }

  goBack() {
    this.location.back();
  }

  mediumLabel() {
    const value = String(this.s().mediumCode || '').toUpperCase();
    return this.formatLanguageCode(value);
  }

  private formatLanguageCode(value: unknown) {
    const key = String(value || '').toUpperCase();
    const mapping: Record<string, string> = {
      MARATHI: 'Marathi',
      HINDI: 'Hindi',
      ENGLISH: 'English',
      URDU: 'Urdu'
    };
    return mapping[key] || this.valueOrDash(value);
  }

  yesNoOrDash(value: unknown) {
    if (value === null || value === undefined || value === '') return '—';
    return value ? 'Yes' : 'No';
  }

  isBacklogCandidate() {
    return ['BACKLOG', 'ATKT', 'REPEATER', 'IMPROVEMENT'].includes(this.a().candidateType);
  }

  isPrivateCandidate() {
    return this.a().candidateType === 'PRIVATE';
  }

  hasOtherDetails() {
    const app = this.a();
    return this.isPrivateCandidate() || this.isBacklogCandidate() || !!app.eligibilityCertNo || (app.eligibilityCertIssued !== null && app.eligibilityCertIssued !== undefined);
  }

  useThreeColumnDetails() {
    const subjectCount = this.a().subjects?.length ?? 0;
    return !this.hasOtherDetails() && !this.isDenseSubjectTable() && subjectCount <= 9;
  }

  isDenseSubjectTable() {
    return (this.a().subjects?.length ?? 0) > 10;
  }

  async print() {
    await Promise.all([
      this.waitForImage('.photo-image'),
      this.waitForImage('.signature-image')
    ]);
    window.print();
  }
}


