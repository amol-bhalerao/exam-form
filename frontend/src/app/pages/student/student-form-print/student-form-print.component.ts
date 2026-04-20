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
        <button mat-stroked-button type="button" class="action-btn" (click)="goBack()">Back</button>
        <button mat-flat-button color="primary" class="action-btn" (click)="print()">Print Form</button>
      </div>
    }

    @if (printBlockedReason()) {
      <div class="page loading-page">
        <div class="blocked-print-box">
          <h3>Print Not Available</h3>
          <p>{{ printBlockedReason() }}</p>
        </div>
      </div>
    }

    @if (!printBlockedReason() && application()) {
      <div class="page">
        <div class="document-shell official-sheet">
          <header class="document-header">
            <div class="board-head compact-head">
              <div class="head-copy">
                <div class="board-name">MAHARASHTRA HSC EXAMINATION PORTAL</div>
                <h1>HIGHER SECONDARY CERTIFICATE EXAMINATION APPLICATION FORM </h1>
                <hr>
                <h1>{{ valueOrDash(a().exam?.name) }} {{ valueOrDash(a().exam?.session) }} {{ valueOrDash(a().exam?.academicYear, '') }}</h1>
                <h1>{{ instituteName() }} ( {{ indexNoValue() }} )</h1>
                
                <div class="institute-subline">{{ instituteAddress() }}</div>
                <div class="institute-meta-row">
                  <span><strong>Index No:</strong> {{ a().institute?.code || a().institute?.collegeNo || '—' }}</span>
                  <span><strong>UDISE No:</strong> {{ udiseNoValue() }}</span>
                  <span><strong>Centre No:</strong> {{ centreNoValue() }}</span>
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
            <div class="section-title">Candidate Personal Particulars</div>
            <div class="detail-list detail-list--personal">
              <div class="detail-line"><span class="line-label">Full Name (Surname First Middle):</span><span class="line-value">{{ fullNameForPrint() }}</span></div>
              <div class="detail-line"><span class="line-label">Mother Name:</span><span class="line-value">{{ valueOrDash(s().motherName) }}</span></div>
              <div class="detail-line"><span class="line-label">Aadhar No:</span><span class="line-value">{{ valueOrDash(s().aadhaar) }}</span></div>
              <div class="detail-line"><span class="line-label">Udise + PEN ID:</span><span class="line-value">{{ studentSaralIdValue() }}</span></div>
              <div class="detail-line"><span class="line-label">APAAR ID:</span><span class="line-value">{{ valueOrDash(s().apaarId) }}</span></div>
              <div class="detail-line"><span class="line-label">Mobile No:</span><span class="line-value">{{ valueOrDash(s().mobile) }}</span></div>
              <div class="detail-line"><span class="line-label">Date Of Birth:</span><span class="line-value">{{ s().dob ? (s().dob | date:'dd MMM, yyyy') : '—' }}</span></div>
              <div class="detail-line"><span class="line-label">Gender:</span><span class="line-value">{{ genderLabel() }}</span></div>
              <div class="detail-line"><span class="line-label">Email:</span><span class="line-value">{{ valueOrDash(s().email || a().user?.email) }}</span></div>
              <div class="detail-line"><span class="line-label">Residential Address:</span><span class="line-value">{{ valueOrDash(s().address) }}</span></div>
              
            </div>
          </section>

          <section class="section-card">
            <div class="section-title">Academic & Reservation Details</div>
            <div class="detail-list detail-list--academic">
              <div class="detail-line"><span class="line-label">Stream:</span><span class="line-value">{{ streamLabel() }}</span></div>
              <div class="detail-line"><span class="line-label">Minority Religion:</span><span class="line-value">{{ religionLabel() }}</span></div>
              <div class="detail-line"><span class="line-label">Category:</span><span class="line-value">{{ categoryLabel() }}</span></div>
              <div class="detail-line"><span class="line-label">Medium of Instruction:</span><span class="line-value">{{ mediumLabel() }}</span></div>
              <div class="detail-line"><span class="line-label">Divyang:</span><span class="line-value">{{ s().divyangCode ? s().divyangCode : 'No' }}</span></div>
              <div class="detail-line"><span class="line-label">SSC from Maharashtra:</span><span class="line-value">{{ yesNoOrDash(s().sscPassedFromMaharashtra) }}</span></div>
              <div class="detail-line"><span class="line-label">Eligibility Certificate:</span><span class="line-value">{{ yesNoOrDash(s().eligibilityCertIssued) }}</span></div>
              <div class="detail-line"><span class="line-label">Certificate No:</span><span class="line-value">{{ valueOrDash(s().eligibilityCertNo) }}</span></div>
            </div>
          </section>

          <section class="section-card">
            <div class="section-title">Subject Details</div>
            <div class="table-wrap">
              <table class="subject-table" [class.subject-table-dense]="isDenseSubjectTable()" [class.subject-table-backlog]="isBacklogCandidate()">
                @if (isBacklogCandidate()) {
                  <colgroup>
                    <col style="width: 5%;" />
                    <col style="width: 8%;" />
                    <col style="width: 20%;" />
                    <col style="width: 11%;" />
                    <col style="width: 9%;" />
                    <col style="width: 10%;" />
                    <col style="width: 8%;" />
                    <col style="width: 7%;" />
                    <col style="width: 8%;" />
                    <col style="width: 14%;" />
                  </colgroup>
                } @else {
                  <colgroup>
                    <col style="width: 6%;" />
                    <col style="width: 12%;" />
                    <col style="width: 42%;" />
                    <col style="width: 20%;" />
                    <col style="width: 20%;" />
                  </colgroup>
                }
                <thead>
                  <tr>
                    <th>Sr.</th>
                    <th>Code</th>
                    <th>Subjects Name</th>
                    <th>Category</th>
                    <th>Ans. Lang</th>
                    @if (isBacklogCandidate()) {
                      <th>Seat No</th>
                      <th>Month</th>
                      <th>Year</th>
                      <th>Marks Obt</th>
                      <th>Previous Exam Seat No</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (sub of orderedPrintSubjects(); track sub.id) {
                    @let backlog = getBacklogInfoForSubject(sub);
                    <tr>
                      <td class="cell-center">{{ $index + 1 }}</td>
                      <td>{{ valueOrDash(sub.subject?.code) }}</td>
                      <td class="subject-name-cell">{{ valueOrDash(sub.subject?.name) }}</td>
                      <td>{{ valueOrDash(sub.subject?.category) }}</td>
                      <td class="cell-center">{{ answerLanguageForPrint(sub) }}</td>
                      @if (isBacklogCandidate()) {
                        <td>{{ valueOrDash(backlog.seatNo || a().lastExamSeatNo) }}</td>
                        <td>{{ valueOrDash(backlog.month || a().lastExamMonth) }}</td>
                        <td>{{ valueOrDash(backlog.year || a().lastExamYear) }}</td>
                        <td>{{ valueOrDash(backlog.marksObt) }}</td>
                        <td>{{ valueOrDash(a().lastExamSeatNo) }}</td>
                      }
                    </tr>
                  }
                  @if (!orderedPrintSubjects().length) {
                    <tr>
                      <td [attr.colspan]="isBacklogCandidate() ? 10 : 5" class="muted center empty-table">No subjects selected yet</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          <section class="section-card">
            <div class="section-title">Type of Candidate & Eligibility</div>
            <div class="detail-list detail-list--academic detail-list--eligibility">
              <div class="detail-line"><span class="line-label">Type:</span><span class="line-value">{{ typeAValue() }}</span></div>
              <div class="detail-line"><span class="line-label">Candidate:</span><span class="line-value">{{ typeBValue() }}</span></div>
              <div class="detail-line"><span class="line-label">Exemption Status:</span><span class="line-value">{{ typeCValue() }}</span></div>
              <div class="detail-line"><span class="line-label">Group:</span><span class="line-value">{{ typeDValue() }}</span></div>
              <div class="detail-line"><span class="line-label">Foreigner:</span><span class="line-value">{{ yesNoOrDash(a().isForeigner) }}</span></div>
              <div class="detail-line"><span class="line-label">Exemptions Claimed:</span><span class="line-value">{{ valueOrDash(a().totalExemptionsClaimed) }}</span></div>
              <div class="detail-line"><span class="line-label">Enrol. Cert No (Private):</span><span class="line-value">{{ enrollmentDetailsForPrint() }}</span></div>
              @if (isBacklogCandidate()) {
                <div class="detail-line"><span class="line-label">Last Exam Seat (Repeater):</span><span class="line-value">{{ lastExamDetailsForPrint() }}</span></div>
              }
              <div class="detail-line"><span class="line-label">SSC Passed (MS Board):</span><span class="line-value">{{ sscMaharashtraForPrint() }}</span></div>
              <div class="detail-line"><span class="line-label">Eligibility Cert Issued:</span><span class="line-value">{{ eligibilityIssuedForPrint() }}</span></div>
              <div class="detail-line"><span class="line-label">Eligibility Cert No:</span><span class="line-value">{{ eligibilityCertNoForPrint() }}</span></div>
            </div>
          </section>

          <section class="section-card">
            <div class="section-title">Previous Examination Passing Details</div>
            <div class="table-wrap">
              <table class="subject-table mini-table">
                <thead>
                  <tr>
                    <th style="width: 18%;">Exam</th>
                    <th style="width: 18%;">Seat No</th>
                    <th style="width: 16%;">Month</th>
                    <th style="width: 12%;">Year</th>
                    <th style="width: 12%;">Marks Obt %</th>
                    <th>Name of Board / Jr. College</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>SSC</td>
                    <td>{{ valueOrDash(sscPreviousExam()?.seatNo) }}</td>
                    <td>{{ valueOrDash(sscPreviousExam()?.month) }}</td>
                    <td>{{ valueOrDash(sscPreviousExam()?.year) }}</td>
                    <td>{{ valueOrDash(sscPreviousExam()?.percentage) }}</td>
                    <td>{{ valueOrDash(sscPreviousExam()?.boardOrCollegeName) }}</td>
                  </tr>
                  <tr>
                    <td>XIth</td>
                    <td>{{ valueOrDash(xithPreviousExam()?.seatNo) }}</td>
                    <td>{{ valueOrDash(xithPreviousExam()?.month) }}</td>
                    <td>{{ valueOrDash(xithPreviousExam()?.year) }}</td>
                    <td>{{ valueOrDash(xithPreviousExam()?.percentage) }}</td>
                    <td>{{ valueOrDash(xithPreviousExam()?.boardOrCollegeName) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="section-card">
            <div class="section-title">Details for reimbursement of fees to students of drought prone areas</div>
            <div class="detail-list detail-list--academic">
              <div class="detail-line"><span class="line-label">A) Revenue Circle And Village:</span><span class="line-value">{{ reimbursementRevenueCircleVillage() }}</span></div>
              <div class="detail-line"><span class="line-label">B) Account No of Student / Parent:</span><span class="line-value">{{ reimbursementAccountNo() }}</span></div>
              <div class="detail-line"><span class="line-label">C) IFSC CODE:</span><span class="line-value">{{ reimbursementIfscCode() }}</span></div>
              <div class="detail-line"><span class="line-label">D) Account Holder:</span><span class="line-value">{{ reimbursementHolderRelation() }}</span></div>
            </div>
          </section>

          <section class="bottom-grid">
            <div class="declaration-box">
              <div class="section-title small-title">Declaration</div>
              <p>
                I hereby declare that the information furnished by me in this form is true and correct to the best of my knowledge.
                            </p>

             

              <div class="note-line">
                Reference: <strong>{{ a().applicationNo || applicationSerialValue() }}</strong>
              </div>

              <div class="declaration-extra-row flex">
                
                <div class="sign-box declaration-signature-box">
                  <div class="asset-caption">Candidate Signature</div>
                  @if (signatureUrl()) {
                    <img [src]="signatureUrl()" alt="Student signature" class="asset-image signature-image declaration-signature-image" loading="eager" (error)="onSignatureLoadError()" />
                  } @else {
                    <span class="placeholder-label">Candidate Signature</span>
                  }
              </div>
              </div>

              
            </div>

  <div class="verification-box">
                  <div class="asset-caption">Verification QR</div>
                  @if (qrCodeUrl()) {
                    <img [src]="qrCodeUrl()!" alt="Application QR" class="asset-image qr-image declaration-qr-image" loading="eager" />
                  } @else {
                    <span class="placeholder-label">QR Not Available</span>
                  }
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
    } @else if (!printBlockedReason()) {
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
        width: min(210mm, calc(100% - 16px));
        margin: 12px auto 0;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        flex-wrap: wrap;
        box-sizing: border-box;
      }

      .actions .action-btn {
        min-width: 124px;
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

      .blocked-print-box {
        border: 1px solid #fca5a5;
        background: #fff1f2;
        color: #881337;
        border-radius: 8px;
        padding: 14px;
        max-width: 620px;
        margin: 30px auto;
        text-align: center;
      }

      .blocked-print-box h3 {
        margin: 0 0 6px;
      }

      .blocked-print-box p {
        margin: 0;
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
        text-transform: uppercase;
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
        font-size: 10px;
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
        text-transform: uppercase;
      }

      .qr-image {
        width: 36px;
        height: 36px;
        object-fit: contain;
        display: block;
        margin-left: 0;
      }

      .declaration-extra-row {
        display: flex;
        justify-content: flex-end;
        align-items: flex-end;
        gap: 4px;
        margin-top: auto;
        align-self: flex-end;
      }

      .verification-box {
        border: 1px solid #000;
        min-width: 60px;
        min-height: 60px;
        padding: 2px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: #fff;
        
      }

      .declaration-qr-image {
        width: 54px;
        height: 54px;
        object-fit: contain;
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
        font-size: 9px;
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

      .detail-list {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 4px 10px;
        padding: 6px;
        border-top: 1px solid #000;
        border-left: 1px solid #000;
      }

      .detail-line {
        display: grid;
        grid-template-columns: 128px minmax(0, 1fr);
        align-items: start;
        column-gap: 8px;
        flex: 0 0 calc(50% - 5px);
        box-sizing: border-box;
        min-width: 0;
        padding: 2px 4px;
        border-right: 1px solid #000;
        border-bottom: 1px solid #000;
      }

      .line-label {
        font-size: 11px;
        font-weight: 700;
        color: #0f172a;
        flex-shrink: 0;
        line-height: 1.2;
      }

      .line-value {
        font-size: 11px;
        line-height: 1.28;
        color: #000;
        font-weight: 600;
        text-transform: uppercase;
        word-break: break-word;
        overflow-wrap: anywhere;
      }

      .detail-list--eligibility {
        display: block;
        column-count: 2;
        column-gap: 10px;
      }

      .detail-list--eligibility .detail-line {
        break-inside: avoid;
        margin: 0 0 4px 0;
        width: auto;
        flex: none;
        grid-template-columns: 110px minmax(0, 1fr);
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
        text-transform: uppercase;
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
        font-size: 6.4px;
      }

      .subject-table th,
      .subject-table td {
        border: 1px solid #000;
        padding: 0.75px 1px;
        vertical-align: middle;
        line-height: 1;
        overflow-wrap: anywhere;
        text-align: center;
      }

      .subject-table.subject-table-dense {
        font-size: 6.3px;
      }

      .subject-table.subject-table-dense th,
      .subject-table.subject-table-dense td {
        padding: 0.65px 0.9px;
        line-height: 1;
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
        text-transform: uppercase;
        white-space: nowrap;
      }

      .subject-table.subject-table-backlog tbody td:not(.subject-name-cell) {
        white-space: nowrap;
      }

      .subject-table.subject-table-backlog .subject-name-cell {
        white-space: normal;
      }

      .subject-name-cell {
        font-weight: 700;
        color: #111827;
        white-space: normal !important;
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
        font-size: 6.5px;
      }

      .mini-table th,
      .mini-table td {
        padding: 1px;
      }

      .bottom-grid {
        display: grid;
        grid-template-columns: 55% 20% 10% 10%;
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
        position: relative;
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
        .actions {
          margin: 10px auto 6px;
          justify-content: stretch;
          gap: 10px;
        }

        .actions .action-btn {
          flex: 1 1 calc(50% - 10px);
          min-width: 0;
        }

        .page {
          width: 100%;
          min-height: auto;
          margin: 0;
          padding: 10px;
        }

        .document-header,
        .grid-4,
        .detail-list {
          justify-content: space-between;
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
        .actions {
          width: calc(100% - 10px);
          margin: 8px auto 6px;
        }

        .actions .action-btn {
          flex: 1 1 100%;
          width: 100%;
        }

        .page {
          padding: 8px;
        }

        .document-header,
        .grid-4,
        .grid-3,
        .detail-line {
          flex-basis: 100%;
        }

        .detail-list--eligibility {
          column-count: 1;
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
          height: calc(297mm - 10mm);
          margin: 0;
          padding: 0;
          box-shadow: none;
          display: block;
          overflow: hidden;
          break-after: avoid-page;
          page-break-after: avoid;
        }

        .official-sheet {
          border: 1.5px solid #000;
          padding: 2.5mm;
          height: calc(297mm - 10mm);
          overflow: hidden;
          zoom: 0.93;
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

        .detail-list {
          display: flex !important;
          flex-wrap: wrap !important;
          align-items: flex-start !important;
          gap: 3px 10px !important;
          padding: 5px 6px !important;
        }

        .detail-line {
          grid-template-columns: 118px minmax(0, 1fr) !important;
          flex: 0 0 calc(50% - 5px) !important;
          column-gap: 6px !important;
          align-items: start !important;
        }

        .detail-list--eligibility {
          display: block !important;
          column-count: 2 !important;
          column-gap: 10px !important;
        }

        .detail-list--eligibility .detail-line {
          grid-template-columns: 100px minmax(0, 1fr) !important;
          width: auto !important;
          flex: none !important;
          margin: 0 0 3px 0 !important;
        }

        .line-label {
          font-size: 11px !important;
        }

        .line-value {
          font-size: 11px !important;
          line-height: 1.24 !important;
        }

        .bottom-grid {
          grid-template-columns: 70% 15% 15% !important;
        }

        .subject-table {
          font-size: 6px !important;
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
          padding: 0.35px 0.8px !important;
          line-height: 0.98 !important;
          height: auto !important;
          min-height: 0 !important;
          white-space: nowrap !important;
          overflow-wrap: normal !important;
          word-break: normal !important;
        }

        .subject-table tr {
          height: auto !important;
          min-height: 0 !important;
        }

        .subject-table .subject-name-cell {
          white-space: nowrap !important;
          line-height: 1 !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }

        .mini-table {
          font-size: 6.1px !important;
        }

        .mini-table th,
        .mini-table td {
          padding: 0.5px 1px !important;
          height: auto !important;
          min-height: 0 !important;
          white-space: nowrap !important;
          overflow-wrap: normal !important;
          word-break: normal !important;
        }

        .standalone-photo-box {
          min-height: 12.5mm !important;
        }

        .declaration-photo-box {
          min-height: 10.5mm !important;
        }

        .declaration-signature-box {
          min-height: 8.5mm !important;
        }

        .principal-sign-box,
        .signature-cell,
        .sign-box {
          min-height: 8.5mm !important;
        }

        .declaration-extra-row {
          margin-top: auto !important;
          justify-content: flex-end !important;
          align-self: flex-end !important;
          gap: 3px !important;
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
  readonly printBlockedReason = signal<string | null>(null);
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
  private cacheBustToken = Date.now();

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
      this.cacheBustToken = Date.now();
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

      if (!this.canPrintApplication(application)) {
        this.application.set(null);
        this.printBlockedReason.set('Only submitted applications with successful payment can be printed.');
        return;
      }

      this.application.set(application);
      this.printBlockedReason.set(null);
      this.photoLoadMode.set('normalized');
      this.signatureLoadMode.set('normalized');
      this.triggerAutoPrintIfNeeded();
    });

    if (!this.embeddedMode) {
      this.http.get<{ student?: any }>(`${API_BASE_URL}/me`).subscribe({
        next: (r: any) => {
          if (!r?.student) return;
          this.cacheBustToken = Date.now();
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
    return !this.hideActions && !this.printBlockedReason();
  }

  canPrintApplication(application: any): boolean {
    if (!application) return false;

    const status = String(application.status || '').toUpperCase();
    const latestPayment = application.fees?.[0] || null;
    const paymentCompleted = !!latestPayment
      && !!latestPayment.receivedAt
      && new Date(latestPayment.receivedAt).getTime() > 1000
      && !String(latestPayment.method || '').toUpperCase().includes('PENDING');

    return status === 'SUBMITTED' && paymentCompleted;
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

    const version = `v=${this.cacheBustToken}`;
    if (/([?&])v=/.test(value)) {
      return value.replace(/([?&])v=[^&]*/i, `$1${version}`);
    }

    return `${value}${value.includes('?') ? '&' : '?'}${version}`;
  }

  private withCacheBustOriginal(url: unknown) {
    if (!url) return null;
    const value = String(url).trim();
    if (!value) return null;

    const version = `v=${this.cacheBustToken}`;
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

  typeAValue() {
    if (this.a().typeA) return this.a().typeA;
    return ['BACKLOG', 'REPEATER', 'ATKT', 'IMPROVEMENT'].includes(this.a().candidateType) ? 'Repeater' : 'Fresh';
  }

  typeBValue() {
    if (this.a().typeB) return this.a().typeB;
    if (this.a().candidateType === 'PRIVATE') return 'Private';
    if (this.a().candidateType === 'IMPROVEMENT') return 'Class Improvement';
    return 'Regular';
  }

  typeCValue() {
    if (this.a().typeC) return this.a().typeC;
    return (this.a().totalExemptionsClaimed || (this.a().exemptedSubjects?.length ?? 0)) > 0 ? 'Exempted' : 'Non Exempted';
  }

  typeDValue() {
    if (this.a().typeD) return this.a().typeD;
    const stream = String(this.s().streamCode || '').toUpperCase();
    if (stream === 'VOCATIONAL' || stream === '4') return 'Vocational';
    return '—';
  }

  enrollmentDetailsForPrint() {
    const month = this.valueOrDash(this.a().enrollmentCertMonth || this.a().enrollmentMonth, '').trim();
    const year = this.valueOrDash(this.a().enrollmentCertYear || this.a().enrollmentYear, '').trim();
    const no = this.valueOrDash(this.a().enrollmentNo || this.a().enrollmentCertNo || this.a().enrollmentCertificateNo, '').trim();
    const parts = [month, year].filter(Boolean).join(' ');
    const serial = no || '—';
    const text = [parts, serial].filter(Boolean).join(' / ');
    return text || '—';
  }

  sscMaharashtraForPrint() {
    const value = this.s().sscPassedFromMaharashtra ?? this.a().sscPassedFromMaharashtra ?? this.a().isSscPassedFromMaharashtra;
    return this.yesNoOrDash(value);
  }

  eligibilityIssuedForPrint() {
    const value = this.s().eligibilityCertIssued
      ?? this.a().eligibilityCertIssued
      ?? this.a().isEligibilityCertIssued
      ?? this.a().eligibilityCertificateIssued;
    return this.yesNoOrDash(value);
  }

  eligibilityCertNoForPrint() {
    const certNo = this.valueOrDash(
      this.s().eligibilityCertNo
      || this.a().eligibilityCertNo
      || this.a().eligibilityCertificateNo
      || this.a().certificateNo,
      ''
    ).trim();

    if (certNo) return certNo;
    return this.valueOrDash(this.a().enrollmentNo || this.a().enrollmentCertNo || this.a().enrollmentCertificateNo);
  }

  lastExamDetailsForPrint() {
    const month = this.valueOrDash(this.a().lastExamMonth, '').trim();
    const year = this.valueOrDash(this.a().lastExamYear, '').trim();
    const seatNo = this.valueOrDash(this.a().lastExamSeatNo, '').trim();
    const when = [month, year].filter(Boolean).join(' ');
    const text = [when, seatNo].filter(Boolean).join(' / ');
    return text || '—';
  }

  fullNameForPrint() {
    const surname = this.valueOrDash(this.s().lastName, '').trim();
    const first = this.valueOrDash(this.s().firstName, '').trim();
    const middle = this.valueOrDash(this.s().middleName, '').trim();
    const combined = [surname, first, middle].filter(Boolean).join(' ').trim();
    return combined || '—';
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

  private codeSortKey(code: unknown): number {
    const parsed = Number(String(code || '').trim());
    return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
  }

  private normalizedCategory(category: unknown): string {
    return String(category || '').trim().toLowerCase();
  }

  private isLanguageCategory(category: unknown): boolean {
    const normalized = this.normalizedCategory(category);
    return normalized === 'language' || normalized.includes('lang');
  }

  private isCompulsoryCategory(category: unknown): boolean {
    const normalized = this.normalizedCategory(category);
    return normalized === 'compulsory' || normalized.includes('compulsory');
  }

  orderedPrintSubjects() {
    const rows = [...(this.a().subjects || [])];
    if (!rows.length || this.isBacklogCandidate()) {
      return rows;
    }

    const english = rows.find((row) => {
      const code = String(row?.subject?.code || '').trim();
      return code === '1' && this.isCompulsoryCategory(row?.subject?.category);
    });

    const languageRows = rows
      .filter((row) => {
        if (!row?.subject) return false;
        const code = String(row.subject.code || '').trim();
        if (english && code === '1') return false;
        return this.isLanguageCategory(row.subject.category);
      })
      .sort((a, b) => this.codeSortKey(a?.subject?.code) - this.codeSortKey(b?.subject?.code));
    const primaryLanguage = languageRows[0];

    const tailRows = rows
      .filter((row) => {
        const code = String(row?.subject?.code || '').trim();
        return code === '30' || code === '31';
      })
      .sort((a, b) => this.codeSortKey(a?.subject?.code) - this.codeSortKey(b?.subject?.code));

    const excluded = new Set<any>();
    if (english) excluded.add(english);
    if (primaryLanguage) excluded.add(primaryLanguage);
    for (const row of tailRows) excluded.add(row);

    const middle = rows
      .filter((row) => !excluded.has(row))
      .sort((a, b) => this.codeSortKey(a?.subject?.code) - this.codeSortKey(b?.subject?.code));

    return [english, primaryLanguage, ...middle, ...tailRows].filter(Boolean);
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
    return this.a().institute?.name || '—';
  }

  instituteAddress() {
    const institute = this.a().institute || {};
    return [institute.address, institute.city, institute.district, institute.state].filter(Boolean).join(', ') || '—';
  }

  examDisplayTitle() {
    const exam = this.a().exam || {};
    return [exam.name, exam.session, exam.academicYear].filter(Boolean).join(' • ');
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
    const student = this.s();
    return this.isPrivateCandidate() || this.isBacklogCandidate() || !!student.eligibilityCertNo || (student.eligibilityCertIssued !== null && student.eligibilityCertIssued !== undefined);
  }

  getBacklogInfoForSubject(subjectRow: any) {
    const byCodeOrName = (this.a().exemptedSubjects || []).find((entry: any) =>
      (entry?.subjectCode && entry.subjectCode === subjectRow?.subject?.code)
      || (entry?.subjectName && entry.subjectName === subjectRow?.subject?.name)
    );

    return byCodeOrName || {
      seatNo: this.a().lastExamSeatNo || null,
      month: this.a().lastExamMonth || null,
      year: this.a().lastExamYear || null,
      marksObt: null
    };
  }

  sscPreviousExam() {
    return (this.s().previousExams || []).find((exam: any) => String(exam?.examType || '').toUpperCase() === 'SSC') || null;
  }

  xithPreviousExam() {
    const acceptedExamTypes = new Set(['XI', '11TH', '11']);
    return (this.s().previousExams || []).find((exam: any) => acceptedExamTypes.has(String(exam?.examType || '').toUpperCase())) || null;
  }

  reimbursementDetails() {
    return this.s().bankDetails || this.s().feeReimbursement || null;
  }

  reimbursementRevenueCircleVillage() {
    const details = this.reimbursementDetails();
    if (!details) return '—';
    return this.valueOrDash(details.revenueCircleAndVillage || details.revenueCircle || details.village || this.s().village || this.s().taluka);
  }

  reimbursementAccountNo() {
    const details = this.reimbursementDetails();
    if (!details) return '—';
    return this.valueOrDash(details.accountNo || details.accountNumber);
  }

  reimbursementIfscCode() {
    const details = this.reimbursementDetails();
    if (!details) return '—';
    return this.valueOrDash(details.ifscCode);
  }

  reimbursementHolderRelation() {
    const details = this.reimbursementDetails();
    if (!details) return '—';
    const mapping: Record<string, string> = {
      SELF: 'Own',
      FATHER: 'Father',
      MOTHER: 'Mother',
      PARENT: 'Parent',
      GUARDIAN: 'Other Parent/Guardian'
    };
    const key = String(details.accountHolderRelation || '').toUpperCase();
    return mapping[key] || this.valueOrDash(details.accountHolderRelation);
  }

  qrCodeUrl() {
    const app = this.a();
    if (!app?.applicationNo) return null;

    const verifyUrl = `${window.location.origin}/verify/document/${encodeURIComponent(app.applicationNo)}`;
    const text = encodeURIComponent(verifyUrl);
    return `https://quickchart.io/qr?size=110&text=${text}`;
  }

  useThreeColumnDetails() {
    const subjectCount = this.a().subjects?.length ?? 0;
    return !this.hasOtherDetails() && !this.isDenseSubjectTable() && subjectCount <= 9;
  }

  isDenseSubjectTable() {
    return (this.a().subjects?.length ?? 0) > 10;
  }

  async print() {
    if (!this.application() || this.printBlockedReason()) return;
    await Promise.all([
      this.waitForImage('.photo-image'),
      this.waitForImage('.signature-image')
    ]);
    window.print();
  }
}


