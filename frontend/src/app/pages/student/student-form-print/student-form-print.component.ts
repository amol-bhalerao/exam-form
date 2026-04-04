import { Component, OnInit, signal, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';

import { API_BASE_URL } from '../../../core/api';

@Component({
  selector: 'app-student-form-print',
  standalone: true,
  imports: [DatePipe, MatButtonModule],
  template: `
    <div class="no-print actions">
      <button mat-flat-button color="primary" (click)="print()">Print</button>
    </div>

    @if (application()) {
      <div class="page">
        <div class="header">
          <div class="title">
            HSC EXAM MANAGEMENT SYSTEM - POWERED BY HISOFT IT SOLUTIONS
          </div>
          <div class="sub">
            APPLICATION FORM FOR H.S.C. EXAMINATION OF {{ application()!.exam.session }}
            {{ application()!.exam.academicYear }}
          </div>
        </div>

        <div class="grid2">
          <div class="box">
            <div class="lbl">1a Index No</div>
            <div class="val">{{ a().indexNo || '—' }}</div>
          </div>
          <div class="box">
            <div class="lbl">1b UDISE No</div>
            <div class="val">{{ a().udiseNo || '—' }}</div>
          </div>
          <div class="box">
            <div class="lbl">1c Student Saral ID</div>
            <div class="val">{{ a().studentSaralId || '—' }}</div>
          </div>
          <div class="box">
            <div class="lbl">2a Appl.Sr.No</div>
            <div class="val">{{ a().applSrNo || '—' }}</div>
          </div>
          <div class="box">
            <div class="lbl">2b Centre No</div>
            <div class="val">{{ a().centreNo || '—' }}</div>
          </div>
        </div>

        <div class="section">
          <div class="row3">
            <div class="box">
              <div class="lbl">3a Last name / Surname</div>
              <div class="val">{{ s().lastName || '—' }}</div>
            </div>
            <div class="box">
              <div class="lbl">3b Candidate’s Name</div>
              <div class="val">{{ s().firstName || '—' }}</div>
            </div>
            <div class="box">
              <div class="lbl">3c Middle/Father’s Name</div>
              <div class="val">{{ s().middleName || '—' }}</div>
            </div>
          </div>
          <div class="row3">
            <div class="box">
              <div class="lbl">3d Mother’s Name</div>
              <div class="val">{{ s().motherName || '—' }}</div>
            </div>
            <div class="box span2">
              <div class="lbl">4 Residential Address</div>
              <div class="val">{{ s().address || '—' }}</div>
            </div>
            <div class="box">
              <div class="lbl">Pin Code</div>
              <div class="val">{{ s().pinCode || '—' }}</div>
            </div>
          </div>
          <div class="row3">
            <div class="box">
              <div class="lbl">5 Mobile No</div>
              <div class="val">{{ s().mobile || '—' }}</div>
            </div>
            <div class="box">
              <div class="lbl">6 Date Of Birth</div>
              <div class="val">{{ s().dob ? (s().dob | date : 'dd/MM/yyyy') : '—' }}</div>
            </div>
            <div class="box">
              <div class="lbl">7 Aadhar No</div>
              <div class="val">{{ s().aadhaar || '—' }}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="row4">
            <div class="box">
              <div class="lbl">8 Stream (code)</div>
              <div class="val">{{ s().streamCode || '—' }}</div>
            </div>
            <div class="box">
              <div class="lbl">9 Gender</div>
              <div class="val">{{ s().gender || '—' }}</div>
            </div>
            <div class="box">
              <div class="lbl">10 Minority Religion (code)</div>
              <div class="val">{{ s().minorityReligionCode || '—' }}</div>
            </div>
            <div class="box">
              <div class="lbl">11 Category (code)</div>
              <div class="val">{{ s().categoryCode || '—' }}</div>
            </div>
            <div class="box">
              <div class="lbl">12 Divyang (code)</div>
              <div class="val">{{ s().divyangCode || '—' }}</div>
            </div>
            <div class="box">
              <div class="lbl">13 Medium (code)</div>
              <div class="val">{{ s().mediumCode || '—' }}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="h">14 Type of Candidate</div>
          <div class="row4">
            <div class="box">
              <div class="lbl">A (Fresh/Repeater)</div>
              <div class="val">{{ a().typeA || '—' }}</div>
            </div>
            <div class="box">
              <div class="lbl">B (Regular/Private/Isolated/Improvement)</div>
              <div class="val">{{ a().typeB || '—' }}</div>
            </div>
            <div class="box">
              <div class="lbl">C (Exempted/Non Exempted)</div>
              <div class="val">{{ a().typeC || '—' }}</div>
            </div>
            <div class="box">
              <div class="lbl">D (Agriculture/Bifocal/IT/General/Home Science)</div>
              <div class="val">{{ a().typeD || '—' }}</div>
            </div>
            <div class="box">
              <div class="lbl">E Foreigner</div>
              <div class="val">{{ a().isForeigner ? 'Yes' : 'No' }}</div>
            </div>
            <div class="box">
              <div class="lbl">16 Total exemptions claimed</div>
              <div class="val">{{ a().totalExemptionsClaimed ?? '—' }}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="h">15 Subject Details</div>
          <table class="tbl">
            <thead>
              <tr>
                <th>Sr</th>
                <th>Subject</th>
                <th>Lang of Ans code</th>
              </tr>
            </thead>
            <tbody>
              @for (sub of (a().subjects ?? []); track sub.id) {
                <tr>
                  <td>{{ $index + 1 }}</td>
                  <td>{{ sub.subject?.name || '—' }} ({{ sub.subject?.code || '' }})</td>
                  <td>{{ sub.langOfAnsCode || '—' }}</td>
                </tr>
              }
              @if (!(a().subjects?.length)) {
                <tr>
                  <td colspan="3" class="muted">No subjects selected yet.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="h">Exempted Subject Information (if any)</div>
          <table class="tbl">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Code</th>
                <th>Seat No</th>
                <th>Month</th>
                <th>Year</th>
                <th>Marks Obt</th>
              </tr>
            </thead>
            <tbody>
              @for (e of (a().exemptedSubjects ?? []); track e.id) {
                <tr>
                  <td>{{ $index + 1 }}</td>
                  <td>{{ e.subjectName || '—' }}</td>
                  <td>{{ e.subjectCode || '—' }}</td>
                  <td>{{ e.seatNo || '—' }}</td>
                  <td>{{ e.month || '—' }}</td>
                  <td>{{ e.year || '—' }}</td>
                  <td>{{ e.marksObt || '—' }}</td>
                </tr>
              }
              @if (!(a().exemptedSubjects?.length)) {
                <tr>
                  <td colspan="7" class="muted">No exemptions.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="h">17–22 Other Details</div>
          <div class="row3">
            <div class="box">
              <div class="lbl">17 Enrollment Cert (Private): Month/Year/No</div>
              <div class="val">{{ a().enrollmentCertMonth || '—' }}/{{ a().enrollmentCertYear || '—' }}/{{ a().enrollmentNo || '—' }}</div>
            </div>
            <div class="box">
              <div class="lbl">19 Last Exam Seat (Repeaters)</div>
              <div class="val">{{ a().lastExamMonth || '—' }} {{ a().lastExamYear || '—' }} / {{ a().lastExamSeatNo || '—' }}</div>
            </div>
            <div class="box">
              <div class="lbl">20 Previous Education Board</div>
              <div class="val">{{ a().sscPassedFromMaharashtra === null || a().sscPassedFromMaharashtra === undefined ? '—' : (a().sscPassedFromMaharashtra ? 'Yes' : 'No') }}</div>
            </div>
          </div>
          <div class="row3">
            <div class="box">
              <div class="lbl">21 Eligibility Certificate issued</div>
              <div class="val">{{ a().eligibilityCertIssued === null || a().eligibilityCertIssued === undefined ? '—' : (a().eligibilityCertIssued ? 'Yes' : 'No') }}</div>
            </div>
            <div class="box">
              <div class="lbl">21 Eligibility Certificate No</div>
              <div class="val">{{ a().eligibilityCertNo || '—' }}</div>
            </div>
            <div class="box">
              <div class="lbl">22 Fee reimbursement (see institute)</div>
              <div class="val muted">Stored in system (if applicable).</div>
            </div>
          </div>
        </div>

        <div class="footerGrid">
          <div class="sig">
            <div class="lbl">CANDIDATE’S SIGNATURE</div>
            <div class="line"></div>
          </div>
          <div class="photo">
            <div class="lbl">CANDIDATE’S PHOTO</div>
            <div class="photoBox"></div>
          </div>
          <div class="qr">
            <div class="lbl">QR / Reference</div>
            <div class="val small">{{ a().applicationNo }}</div>
          </div>
        </div>
      </div>
    } @else {
      <div class="page">Loading…</div>
    }
  `,
  styles: [
    `
      .actions {
        padding: 12px;
      }
      .page {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        background: white;
        color: #111;
        padding: 8mm;
        box-sizing: border-box;
      }
      .header {
        text-align: center;
        border: 1px solid #111;
        padding: 6px;
      }
      .title {
        font-weight: 800;
        font-size: 12px;
      }
      .sub {
        margin-top: 4px;
        font-size: 11px;
      }
      .grid2 {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 4px;
        margin-top: 6px;
      }
      .row3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 4px;
      }
      .row4 {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 4px;
      }
      .section {
        margin-top: 6px;
      }
      .box {
        border: 1px solid #111;
        padding: 4px 6px;
        min-height: 20px;
      }
      .lbl {
        font-size: 9px;
        font-weight: 700;
        text-transform: none;
      }
      .val {
        margin-top: 2px;
        font-size: 11px;
        min-height: 14px;
      }
      .small {
        font-size: 10px;
      }
      .span2 {
        grid-column: span 2;
      }
      .h {
        font-size: 10px;
        font-weight: 800;
        margin-bottom: 4px;
      }
      .tbl {
        width: 100%;
        border-collapse: collapse;
        font-size: 10px;
      }
      .tbl th,
      .tbl td {
        border: 1px solid #111;
        padding: 3px 4px;
        vertical-align: top;
      }
      .muted {
        color: #555;
      }
      .footerGrid {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr;
        gap: 6px;
        margin-top: 8px;
        align-items: end;
      }
      .sig .line {
        border-bottom: 1px solid #111;
        height: 22px;
      }
      .photoBox {
        border: 1px solid #111;
        height: 44mm;
      }
      @media print {
        .no-print {
          display: none !important;
        }
        body {
          background: white;
        }
        .page {
          margin: 0;
          box-shadow: none;
        }
      }
    `
  ]
})
export class StudentFormPrintComponent implements OnInit {
  readonly application = signal<any | null>(null);
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

  constructor() {}

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

  print() {
    window.print();
  }
}

