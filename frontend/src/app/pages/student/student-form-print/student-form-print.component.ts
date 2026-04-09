import { Component, OnInit, signal, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
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
    <div class="no-print actions">
      <button mat-stroked-button type="button" onclick="window.history.back()">Back</button>
      <button mat-flat-button color="primary" (click)="print()">Print Form</button>
    </div>

    @if (application()) {
      <div class="page">
        <div class="document-shell official-sheet">
          <header class="document-header">
            <div class="board-head compact-head">
              <div class="head-copy">
                <div class="board-name">MAHARASHTRA HSC EXAMINATION PORTAL</div>
                <div class="board-name mr">महाराष्ट्र उच्च माध्यमिक परीक्षा पोर्टल</div>
                <h1>HIGHER SECONDARY CERTIFICATE EXAMINATION APPLICATION FORM / उच्च माध्यमिक प्रमाणपत्र परीक्षेसाठी अर्ज</h1>
                <div class="exam-line">{{ examDisplayTitle() }}</div>
                <div class="exam-subline">Institute / महाविद्यालय: {{ instituteName() }}</div>
              </div>
            </div>
          </header>

          <section class="section-card summary-strip meta-strip">
            <div class="summary-item">
              <span>Application No / अर्ज क्र.</span>
              <strong>{{ a().applicationNo || '—' }}</strong>
            </div>
            <div class="summary-item">
              <span>Status / स्थिती</span>
              <strong class="status-chip" [attr.data-tone]="statusTone()">{{ statusLabel() }}</strong>
            </div>
            <div class="summary-item">
              <span>Printed / मुद्रित</span>
              <strong>{{ printedAt | date:'dd/MM/yyyy' }}</strong>
            </div>
            <div class="summary-item">
              <span>Candidate Type / उमेदवार प्रकार</span>
              <strong>{{ candidateTypeLabel() }}</strong>
            </div>
          </section>

          <section class="section-card">
            <div class="section-title">1. Reference & Institute Details / संदर्भ व महाविद्यालय तपशील</div>
            <div class="detail-grid grid-4 compact-grid">
              <div class="detail-item">
                <label>Index No / अनुक्रमांक</label>
                <div>{{ indexNoValue() }}</div>
              </div>
              <div class="detail-item">
                <label>UDISE No / यूडाइस क्रमांक</label>
                <div>{{ udiseNoValue() }}</div>
              </div>
              <div class="detail-item">
                <label>Student Saral ID / विद्यार्थी सरल आयडी</label>
                <div>{{ studentSaralIdValue() }}</div>
              </div>
              <div class="detail-item">
                <label>Centre No / केंद्र क्रमांक</label>
                <div>{{ centreNoValue() }}</div>
              </div>
              <div class="detail-item">
                <label>Application Serial No / अर्ज अनुक्रमांक</label>
                <div>{{ applicationSerialValue() }}</div>
              </div>
              <div class="detail-item">
                <label>Institute Code / महाविद्यालय कोड</label>
                <div>{{ a().institute?.code || a().institute?.collegeNo || '—' }}</div>
              </div>
              <div class="detail-item">
                <label>Institute Name / महाविद्यालयाचे नाव</label>
                <div>{{ instituteName() }}</div>
              </div>
              <div class="detail-item">
                <label>Institute Address / महाविद्यालयाचा पत्ता</label>
                <div>{{ instituteAddress() }}</div>
              </div>
            </div>
          </section>

          <section class="section-card">
            <div class="section-title">2. Candidate Personal Particulars / उमेदवाराची वैयक्तिक माहिती</div>
            <div class="detail-grid grid-4">
              <div class="detail-item">
                <label>Surname / आडनाव</label>
                <div>{{ valueOrDash(s().lastName) }}</div>
              </div>
              <div class="detail-item">
                <label>First Name / नाव</label>
                <div>{{ valueOrDash(s().firstName) }}</div>
              </div>
              <div class="detail-item">
                <label>Middle Name / वडिलांचे नाव</label>
                <div>{{ valueOrDash(s().middleName) }}</div>
              </div>
              <div class="detail-item">
                <label>Mother Name / आईचे नाव</label>
                <div>{{ valueOrDash(s().motherName) }}</div>
              </div>

              <div class="detail-item">
                <label>Residential Address / निवासी पत्ता</label>
                <div>{{ valueOrDash(s().address) }}</div>
              </div>
              <div class="detail-item">
                <label>Pin Code / पिन कोड</label>
                <div>{{ valueOrDash(s().pinCode) }}</div>
              </div>
              <div class="detail-item">
                <label>Mobile No / मोबाईल क्रमांक</label>
                <div>{{ valueOrDash(s().mobile) }}</div>
              </div>
              <div class="detail-item">
                <label>Aadhaar No / आधार क्रमांक</label>
                <div>{{ valueOrDash(s().aadhaar) }}</div>
              </div>

              <div class="detail-item">
                <label>Date of Birth / जन्मतारीख</label>
                <div>{{ s().dob ? (s().dob | date:'dd/MM/yyyy') : '—' }}</div>
              </div>
              <div class="detail-item">
                <label>Gender / लिंग</label>
                <div>{{ genderLabel() }}</div>
              </div>
              <div class="detail-item">
                <label>Application No / अर्ज क्र.</label>
                <div>{{ a().applicationNo || '—' }}</div>
              </div>
              <div class="detail-item">
                <label>Candidate Type / उमेदवार प्रकार</label>
                <div>{{ candidateTypeLabel() }}</div>
              </div>
            </div>
          </section>

          <section class="section-card">
            <div class="section-title">3. Academic & Reservation Details / शैक्षणिक व आरक्षण तपशील</div>
            <div class="detail-grid grid-4 compact-grid">
              <div class="detail-item">
                <label>Stream / प्रवाह</label>
                <div>{{ streamLabel() }}</div>
              </div>
              <div class="detail-item">
                <label>Minority Religion / अल्पसंख्याक धर्म</label>
                <div>{{ religionLabel() }}</div>
              </div>
              <div class="detail-item">
                <label>Category / प्रवर्ग</label>
                <div>{{ categoryLabel() }}</div>
              </div>
              <div class="detail-item">
                <label>Medium / माध्यम</label>
                <div>{{ mediumLabel() }}</div>
              </div>
              <div class="detail-item">
                <label>Divyang Code / दिव्यांग कोड</label>
                <div>{{ s().divyangCode ? s().divyangCode : 'No / नाही' }}</div>
              </div>
              <div class="detail-item">
                <label>SSC from Maharashtra / महाराष्ट्रातून SSC</label>
                <div>{{ yesNoOrDash(a().sscPassedFromMaharashtra) }}</div>
              </div>
              <div class="detail-item">
                <label>Eligibility Certificate / पात्रता प्रमाणपत्र</label>
                <div>{{ yesNoOrDash(a().eligibilityCertIssued) }}</div>
              </div>
              <div class="detail-item">
                <label>Certificate No / प्रमाणपत्र क्र.</label>
                <div>{{ valueOrDash(a().eligibilityCertNo) }}</div>
              </div>
            </div>
          </section>

          <section class="section-card">
            <div class="section-title">4. Subject Details / विषय तपशील</div>
            <div class="table-wrap">
              <table class="subject-table">
                <thead>
                  <tr>
                    <th style="width: 7%;">Sr / क्र.</th>
                    <th style="width: 12%;">Code / कोड</th>
                    <th>Subject Name / विषयाचे नाव</th>
                    <th style="width: 20%;">Category / प्रकार</th>
                    <th style="width: 15%;">Ans. Lang / उत्तर माध्यम</th>
                  </tr>
                </thead>
                <tbody>
                  @for (sub of (a().subjects ?? []); track sub.id) {
                    <tr>
                      <td class="cell-center">{{ $index + 1 }}</td>
                      <td><span class="subject-code-pill">{{ valueOrDash(sub.subject?.code) }}</span></td>
                      <td class="subject-name-cell">{{ valueOrDash(sub.subject?.name) }}</td>
                      <td>{{ valueOrDash(sub.subject?.category, 'General / सामान्य') }}</td>
                      <td class="cell-center">{{ valueOrDash(sub.langOfAnsCode) }}</td>
                    </tr>
                  }
                  @if (!(a().subjects?.length)) {
                    <tr>
                      <td colspan="5" class="muted center empty-table">No subjects selected yet / विषय निवडलेले नाहीत.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          @if (hasOtherDetails()) {
            <section class="section-card">
              <div class="section-title">5. Additional Information / अतिरिक्त माहिती</div>
              <div class="detail-grid grid-4 compact-grid">
                <div class="detail-item">
                  <label>Exemptions Claimed / सूट विषय</label>
                  <div>{{ a().totalExemptionsClaimed ?? ((a().exemptedSubjects?.length ?? 0) || 0) }}</div>
                </div>
                <div class="detail-item">
                  <label>Previous Attempt / मागील परीक्षा तपशील</label>
                  <div>{{ valueOrDash(a().lastExamMonth) }} {{ valueOrDash(a().lastExamYear, '') }} / {{ valueOrDash(a().lastExamSeatNo, 'No seat no') }}</div>
                </div>
                <div class="detail-item">
                  <label>Enrollment Cert / नावनोंदणी प्रमाणपत्र</label>
                  <div>{{ valueOrDash(a().enrollmentCertMonth, '—') }} / {{ valueOrDash(a().enrollmentCertYear, '—') }} / {{ valueOrDash(a().enrollmentNo, '—') }}</div>
                </div>
                <div class="detail-item">
                  <label>Special Remark / विशेष नोंद</label>
                  <div>{{ isBacklogCandidate() ? 'Backlog / Repeater candidate' : 'Regular / Fresh candidate' }}</div>
                </div>
              </div>

              @if (isBacklogCandidate()) {
                <table class="subject-table mini-table">
                  <thead>
                    <tr>
                      <th>Subject / विषय</th>
                      <th>Code / कोड</th>
                      <th>Seat No / बैठक क्र.</th>
                      <th>Month / महिना</th>
                      <th>Year / वर्ष</th>
                      <th>Marks / गुण</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (e of (a().exemptedSubjects ?? []); track e.id) {
                      <tr>
                        <td>{{ valueOrDash(e.subjectName) }}</td>
                        <td>{{ valueOrDash(e.subjectCode) }}</td>
                        <td>{{ valueOrDash(e.seatNo) }}</td>
                        <td>{{ valueOrDash(e.month) }}</td>
                        <td>{{ valueOrDash(e.year) }}</td>
                        <td>{{ valueOrDash(e.marksObt) }}</td>
                      </tr>
                    }
                    @if (!(a().exemptedSubjects?.length)) {
                      <tr>
                        <td colspan="6" class="muted center">No exempted subject details provided / सूट माहिती उपलब्ध नाही.</td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </section>
          }

          <section class="bottom-grid">
            <div class="declaration-box">
              <div class="section-title small-title">6. Declaration / घोषणा</div>
              <p>
                I hereby declare that the information furnished by me in this form is true and correct to the best of my knowledge.
                मी या अर्जातील सर्व माहिती माझ्या माहितीनुसार खरी व अचूक असल्याचे जाहीर करतो/करते.
              </p>
              <div class="note-line">
                Reference / संदर्भ: <strong>{{ a().applicationNo || applicationSerialValue() }}</strong>
              </div>
            </div>

            <div class="photo-sign-wrap">
              <div class="photo-box signature-cell candidate-photo-box">
                @if (s().photoUrl) {
                  <img [src]="s().photoUrl" alt="Student photograph" class="asset-image photo-image" />
                } @else {
                  <span class="placeholder-label">Student Photo / छायाचित्र</span>
                }
              </div>
              <div class="sign-box signature-cell candidate-sign-box">
                @if (s().signatureUrl) {
                  <img [src]="s().signatureUrl" alt="Student signature" class="asset-image signature-image" />
                } @else {
                  <span class="placeholder-label">Candidate Signature / उमेदवाराची सही</span>
                }
              </div>
              <div class="sign-box signature-cell teacher-sign-box"><span class="placeholder-label">Class Teacher / वर्गशिक्षक सही</span></div>
              <div class="sign-box signature-cell principal-sign-box"><span class="placeholder-label">Principal Seal & Signature / मुख्याध्यापक शिक्का व सही</span></div>
            </div>
          </section>

          <footer class="document-footer">
            <span>This is a system-generated official print view for A4 paper / ही A4 साठी प्रणालीद्वारे तयार केलेली प्रत आहे.</span>
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
        font-family: 'Times New Roman', Georgia, serif;
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
      }

      .document-header {
        display: grid;
        grid-template-columns: 1fr;
        gap: 4px;
        align-items: stretch;
      }

      .board-head,
      .header-side,
      .section-card,
      .declaration-box,
      .sign-box,
      .photo-box,
      .summary-strip {
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

      .logo-box {
        width: 48px;
        height: 48px;
        border: 1px solid #000;
        display: grid;
        place-items: center;
        overflow: hidden;
      }

      .logo-box img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .board-name {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        text-align: center;
      }

      .board-name.mr {
        margin-top: 1px;
        letter-spacing: 0;
        text-transform: none;
      }

      .head-copy h1,
      .head-copy h2 {
        margin: 2px 0;
        text-align: center;
        font-weight: 700;
      }

      .head-copy h1 {
        font-size: 13px;
        line-height: 1.15;
        margin: 1px 0;
      }

      .head-copy h2 {
        font-size: 11px;
        line-height: 1.1;
      }

      .exam-line,
      .exam-subline {
        font-size: 9px;
        text-align: center;
        margin-top: 1px;
      }

      .header-side {
        display: none;
      }

      .top-photo {
        min-height: 28mm;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding: 4px;
        font-size: 9px;
        font-weight: 700;
        text-align: center;
        border-bottom: 1px solid #000;
      }

      .meta-table {
        display: grid;
      }

      .meta-row {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        padding: 5px 6px;
        border-top: 1px solid #000;
        font-size: 9px;
      }

      .meta-row:first-child {
        border-top: 0;
      }

      .meta-row span {
        font-weight: 700;
      }

      .meta-row strong {
        text-align: right;
      }

      .status-chip {
        display: inline-block;
        padding: 1px 6px;
        border: 1px solid #000;
        font-size: 8px;
        text-transform: uppercase;
        background: #f3f4f6;
      }

      .summary-strip {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
      }

      .meta-strip {
        margin-top: 1px;
      }

      .summary-item {
        padding: 4px 5px;
        border-right: 1px solid #000;
      }

      .summary-item:last-child {
        border-right: 0;
      }

      .summary-item span,
      .detail-item label {
        display: block;
        font-size: 8px;
        font-weight: 700;
        text-transform: uppercase;
        margin-bottom: 2px;
      }

      .summary-item strong {
        font-size: 10px;
      }

      .section-card {
        padding: 0;
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .section-title {
        padding: 3px 5px;
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
        gap: 0;
      }

      .grid-4 {
        grid-template-columns: repeat(4, 1fr);
      }

      .grid-3 {
        grid-template-columns: repeat(3, 1fr);
      }

      .detail-item {
        padding: 3px 5px;
        min-height: 28px;
        border-right: 1px solid #000;
        border-bottom: 1px solid #000;
      }

      .detail-grid .detail-item:nth-last-child(-n + 4) {
        border-bottom: 0;
      }

      .grid-3 .detail-item:nth-last-child(-n + 3) {
        border-bottom: 0;
      }

      .detail-item:nth-child(4n) {
        border-right: 0;
      }

      .grid-3 .detail-item:nth-child(3n) {
        border-right: 0;
      }

      .detail-item div {
        font-size: 9px;
        line-height: 1.22;
        word-break: break-word;
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
        font-size: 8px;
      }

      .subject-table th,
      .subject-table td {
        border: 1px solid #000;
        padding: 2px 4px;
        vertical-align: middle;
        line-height: 1.15;
      }

      .subject-table tbody tr {
        height: 24px;
      }

      .subject-table thead th {
        background: linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%);
        font-weight: 700;
        text-align: left;
        letter-spacing: 0.01em;
      }

      .subject-table tbody tr:nth-child(even) {
        background: #fafafa;
      }

      .subject-name-cell {
        font-weight: 600;
        color: #111827;
        word-break: break-word;
      }

      .subject-code-pill {
        display: inline-block;
        padding: 1px 5px;
        border: 1px solid #9ca3af;
        border-radius: 999px;
        background: #f9fafb;
        font-size: 7.7px;
        line-height: 1.1;
      }

      .cell-center {
        text-align: center;
        vertical-align: middle;
      }

      .empty-table {
        padding: 8px 6px !important;
        font-style: italic;
      }

      .mini-table {
        margin-top: 0;
        border-top: 0;
      }

      .bottom-grid {
        display: grid;
        grid-template-columns: 1.45fr 1.25fr;
        gap: 4px;
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .declaration-box {
        padding: 5px 6px;
      }

      .declaration-box p {
        margin: 0;
        font-size: 8.7px;
        line-height: 1.38;
      }

      .note-line {
        margin-top: 6px;
        font-size: 8.7px;
      }

      .photo-sign-wrap {
        display: grid;
        grid-template-columns: 34mm 1fr 1fr;
        grid-template-areas:
          'photo candidate candidate'
          'photo teacher principal';
        gap: 4px;
        align-items: stretch;
      }

      .candidate-photo-box {
        grid-area: photo;
        min-height: 35mm;
        align-items: center;
      }

      .candidate-sign-box {
        grid-area: candidate;
      }

      .teacher-sign-box {
        grid-area: teacher;
      }

      .principal-sign-box {
        grid-area: principal;
      }

      .sign-box,
      .photo-box {
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding: 4px;
        font-size: 8px;
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
        object-fit: contain;
        display: block;
      }

      .photo-image {
        object-fit: cover;
      }

      .signature-image {
        object-fit: contain;
        padding: 2px;
      }

      .signature-cell {
        min-height: 15mm;
      }

      .sign-box {
        min-height: 15mm;
      }

      .document-footer {
        margin-top: auto;
        display: flex;
        justify-content: space-between;
        gap: 8px;
        border-top: 1px solid #000;
        padding-top: 4px;
        font-size: 8px;
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

        .grid-4,
        .summary-strip {
          grid-template-columns: repeat(2, 1fr);
        }

        .photo-sign-wrap {
          grid-template-columns: repeat(2, 1fr);
          grid-template-areas:
            'photo candidate'
            'teacher principal';
        }

        .bottom-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 520px) {
        .page {
          padding: 8px;
        }

        .grid-4,
        .grid-3,
        .summary-strip,
        .photo-sign-wrap {
          grid-template-columns: 1fr;
        }

        .photo-sign-wrap {
          grid-template-areas:
            'photo'
            'candidate'
            'teacher'
            'principal';
        }

        .detail-item,
        .grid-3 .detail-item,
        .detail-item:nth-child(4n),
        .grid-3 .detail-item:nth-child(3n) {
          border-right: 0;
        }

        .summary-item {
          border-right: 0;
          border-bottom: 1px solid #000;
        }

        .summary-item:last-child {
          border-bottom: 0;
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
          min-height: auto;
          margin: 0;
          padding: 0;
          box-shadow: none;
        }

        .official-sheet {
          border: 1.5px solid #000;
          padding: 2.5mm;
        }

        .summary-strip {
          grid-template-columns: repeat(4, 1fr) !important;
        }

        .grid-4 {
          grid-template-columns: repeat(4, 1fr) !important;
        }

        .grid-3 {
          grid-template-columns: repeat(3, 1fr) !important;
        }

        .bottom-grid {
          grid-template-columns: 1.45fr 1.25fr !important;
        }

        .photo-sign-wrap {
          grid-template-columns: 34mm 1fr 1fr !important;
          grid-template-areas:
            'photo candidate candidate'
            'photo teacher principal' !important;
        }

        .section-card,
        .summary-strip,
        .bottom-grid,
        .declaration-box,
        .photo-sign-wrap,
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
  readonly application = signal<any | null>(null);
  readonly printedAt = new Date();
  readonly branding = inject(BrandingService);

  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.http.get<{ application: any }>(`${API_BASE_URL}/applications/${id}`).subscribe((r: any) => this.application.set(r.application));
  }

  a() {
    return this.application() ?? {};
  }

  s() {
    return this.application()?.student ?? {};
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
    return this.a().applSrNo || this.a().applicationNo || '—';
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
    return [exam.name || 'HSC Examination', exam.session, exam.academicYear].filter(Boolean).join(' • ');
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
      HINDU: 'Hindu',
      MUSLIM: 'Muslim',
      CHRISTIAN: 'Christian',
      BUDDHIST: 'Buddhist',
      SIKH: 'Sikh',
      JAIN: 'Jain',
      PARSI: 'Parsi',
      OTHER: 'Other'
    };
    return mapping[value] || this.valueOrDash(this.s().minorityReligionCode);
  }

  categoryLabel() {
    const value = String(this.s().categoryCode || '').toUpperCase();
    const mapping: Record<string, string> = {
      OPEN: 'Open',
      SC: 'SC',
      ST: 'ST',
      OBC: 'OBC',
      SBC: 'SBC',
      VJ: 'VJ',
      NT: 'NT',
      EWS: 'EWS'
    };
    return mapping[value] || this.valueOrDash(this.s().categoryCode);
  }

  mediumLabel() {
    const value = String(this.s().mediumCode || '').toUpperCase();
    const mapping: Record<string, string> = {
      MARATHI: 'Marathi',
      HINDI: 'Hindi',
      ENGLISH: 'English',
      URDU: 'Urdu'
    };
    return mapping[value] || this.valueOrDash(this.s().mediumCode);
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

  print() {
    window.print();
  }
}

