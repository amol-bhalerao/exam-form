import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AgGridModule } from 'ag-grid-angular';
import type { ColDef } from 'ag-grid-community';

import { API_BASE_URL } from '../../../core/api';

type Institute = {
  id: number;
  name: string;
  code?: string;
  collegeNo?: string;
  udiseNo?: string;
  district?: string;
  city?: string;
  address?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactMobile?: string;
  status?: string;
  acceptingApplications?: boolean;
  boardType?: string;
  createdAt?: string;
};

type Dashboard = {
  total: number;
  acceptingApplications: number;
  approved: number;
  pending: number;
  disabled: number;
  rejected: number;
  byStatus: Record<string, number>;
  byBoardType: Record<string, number>;
  byDistrict: Array<{ district: string; count: number }>;
  boardType?: string;
};

@Component({
  selector: 'app-board-institutes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    AgGridModule
  ],
  template: `
    <section class="board-institutes-page">
      <mat-card class="hero-card">
        <div>
          <div class="eyebrow">Board Institute Dashboard</div>
          <h1>Institute monitoring across districts</h1>
          <p>View {{ dashboard()?.boardType || 'your' }} board institutes, current status, accepting-application readiness, and district-wise distribution.</p>
          <p class="mr">{{ dashboard()?.boardType || 'आपल्या' }} बोर्डच्या संस्था, सद्यस्थिती, अर्ज स्वीकारण्याची तयारी आणि जिल्हानिहाय वितरण येथे पाहता येते.</p>
        </div>
        <button mat-stroked-button type="button" (click)="load()" [disabled]="loading()">
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
      </mat-card>

      @if (errorMessage()) {
        <mat-card class="error-card">
          <mat-icon>error</mat-icon>
          {{ errorMessage() }}
        </mat-card>
      }

      <div class="summary-grid">
        <mat-card class="summary-card total">
          <span>{{ dashboard()?.boardType || 'Board' }} Institutes</span>
          <strong>{{ dashboard()?.total || 0 }}</strong>
          <small>एकूण संस्था</small>
        </mat-card>
        <mat-card class="summary-card approved">
          <span>Approved</span>
          <strong>{{ dashboard()?.approved || 0 }}</strong>
          <small>मंजूर संस्था</small>
        </mat-card>
        <mat-card class="summary-card pending">
          <span>Pending</span>
          <strong>{{ dashboard()?.pending || 0 }}</strong>
          <small>प्रलंबित संस्था</small>
        </mat-card>
        <mat-card class="summary-card accepting">
          <span>Accepting Applications</span>
          <strong>{{ dashboard()?.acceptingApplications || 0 }}</strong>
          <small>अर्ज स्वीकारणाऱ्या संस्था</small>
        </mat-card>
      </div>

      <div class="insight-grid">
        <mat-card class="panel">
          <div class="panel-title">
            <mat-icon>map</mat-icon>
            District-wise Institutes
          </div>
          <div class="district-list">
            @for (item of topDistricts(); track item.district) {
              <button type="button" class="district-row" (click)="setDistrictFilter(item.district)">
                <span>{{ item.district }}</span>
                <strong>{{ item.count }}</strong>
              </button>
            } @empty {
              <div class="empty">No district data available.</div>
            }
          </div>
        </mat-card>

        <mat-card class="panel">
          <div class="panel-title">
            <mat-icon>donut_large</mat-icon>
            Current Status
          </div>
          <div class="status-stack">
            @for (item of statusBreakdown(); track item.status) {
              <div class="status-row">
                <span class="status-dot" [class]="item.status.toLowerCase()"></span>
                <span>{{ item.status }}</span>
                <strong>{{ item.count }}</strong>
              </div>
            }
          </div>
          <div class="board-type-row">
            @for (item of boardTypeBreakdown(); track item.type) {
              <span>{{ item.type }}: <strong>{{ item.count }}</strong></span>
            }
          </div>
        </mat-card>
      </div>

      <mat-card class="table-panel">
        <div class="table-header">
          <div>
            <div class="panel-title">Institute List</div>
            <p>Search, filter, sort and review district/status details. This is a read-only board dashboard.</p>
          </div>
          <div class="filters">
            <mat-form-field appearance="outline">
              <mat-label>Search</mat-label>
              <mat-icon matPrefix>search</mat-icon>
              <input matInput [(ngModel)]="search" (ngModelChange)="refreshFilters()" placeholder="Name, code, district, mobile" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="statusFilter" (ngModelChange)="refreshFilters()">
                <mat-option value="">All</mat-option>
                @for (status of statusOptions(); track status) {
                  <mat-option [value]="status">{{ status }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>District</mat-label>
              <mat-select [(ngModel)]="districtFilter" (ngModelChange)="refreshFilters()">
                <mat-option value="">All</mat-option>
                @for (district of districtOptions(); track district) {
                  <mat-option [value]="district">{{ district }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Board</mat-label>
              <mat-select [(ngModel)]="boardTypeFilter" (ngModelChange)="refreshFilters()">
                <mat-option value="">All</mat-option>
                @for (type of boardTypeOptions(); track type) {
                  <mat-option [value]="type">{{ type }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        <div class="table-meta">
          <span>{{ filteredInstitutes().length }} institutes shown</span>
          <button mat-button type="button" (click)="clearFilters()">Clear filters</button>
        </div>

        <div class="grid-wrap">
          <ag-grid-angular
            class="ag-theme-alpine"
            style="width: 100%; height: 100%;"
            [rowData]="filteredInstitutes()"
            [columnDefs]="columnDefs"
            [defaultColDef]="defaultColDef"
            [pagination]="true"
            [paginationPageSize]="20"
          ></ag-grid-angular>
        </div>
      </mat-card>
    </section>
  `,
  styles: [`
    .board-institutes-page {
      display: grid;
      gap: 18px;
    }

    .hero-card {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 18px;
      padding: clamp(20px, 3vw, 30px);
      border: 0;
      border-radius: 28px;
      background:
        radial-gradient(circle at 92% 20%, rgba(255, 152, 0, 0.2), transparent 24%),
        linear-gradient(135deg, #1f2343, #667eea);
      color: #fff;
      box-shadow: 0 24px 72px rgba(31, 35, 67, 0.22);
    }

    .eyebrow {
      width: fit-content;
      margin-bottom: 12px;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(255,255,255,0.16);
      font-size: 12px;
      font-weight: 900;
      letter-spacing: .08em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0 0 10px;
      font-size: clamp(28px, 4vw, 46px);
      line-height: 0.95;
      letter-spacing: -0.06em;
    }

    p {
      margin: 0;
      color: #64748b;
      line-height: 1.55;
    }

    .hero-card p {
      max-width: 760px;
      color: rgba(255,255,255,0.82);
    }

    .hero-card .mr {
      margin-top: 5px;
      font-family: 'Nirmala UI', sans-serif;
      font-weight: 700;
    }

    .hero-card button {
      color: #fff;
      border-color: rgba(255,255,255,0.6);
      flex: 0 0 auto;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
    }

    .summary-card {
      min-height: 130px;
      padding: 18px;
      border-radius: 22px;
      box-shadow: 0 16px 42px rgba(15, 23, 42, 0.08);
    }

    .summary-card span,
    .summary-card small {
      display: block;
      color: #64748b;
      font-weight: 800;
    }

    .summary-card strong {
      display: block;
      margin: 10px 0 4px;
      color: #1f2343;
      font-size: 36px;
      line-height: 1;
      letter-spacing: -0.06em;
    }

    .summary-card.total { border-top: 4px solid #667eea; }
    .summary-card.approved { border-top: 4px solid #22c55e; }
    .summary-card.pending { border-top: 4px solid #f59e0b; }
    .summary-card.accepting { border-top: 4px solid #2196f3; }

    .insight-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(360px, .9fr);
      gap: 16px;
    }

    .panel,
    .table-panel,
    .error-card {
      padding: 18px;
      border-radius: 22px;
      box-shadow: 0 16px 42px rgba(15, 23, 42, 0.08);
    }

    .error-card {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #b91c1c;
      background: #fff1f2;
    }

    .panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1f2343;
      font-size: 18px;
      font-weight: 900;
    }

    .district-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-top: 16px;
      max-height: 340px;
      overflow: auto;
    }

    .district-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      background: #f8fafc;
      color: #334155;
      cursor: pointer;
      text-align: left;
      font-weight: 800;
    }

    .district-row:hover {
      border-color: #667eea;
      background: #eef2ff;
    }

    .district-row strong {
      color: #667eea;
    }

    .status-stack {
      display: grid;
      gap: 10px;
      margin-top: 16px;
    }

    .status-row {
      display: grid;
      grid-template-columns: 14px 1fr auto;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 14px;
      background: #f8fafc;
      font-weight: 800;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #94a3b8;
    }

    .status-dot.approved { background: #22c55e; }
    .status-dot.pending { background: #f59e0b; }
    .status-dot.disabled { background: #64748b; }
    .status-dot.rejected { background: #ef4444; }

    .board-type-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
    }

    .board-type-row span {
      padding: 7px 10px;
      border-radius: 999px;
      background: #eef2ff;
      color: #4338ca;
      font-weight: 900;
    }

    .table-header {
      display: grid;
      grid-template-columns: minmax(260px, 0.9fr) minmax(0, 1.3fr);
      gap: 16px;
      align-items: start;
    }

    .filters {
      display: grid;
      grid-template-columns: repeat(4, minmax(120px, 1fr));
      gap: 10px;
    }

    .filters mat-form-field {
      width: 100%;
    }

    .table-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin: 6px 0 12px;
      color: #64748b;
      font-weight: 800;
    }

    .grid-wrap {
      width: 100%;
      height: 520px;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      overflow: hidden;
    }

    .empty {
      color: #64748b;
      padding: 10px;
    }

    @media (max-width: 980px) {
      .hero-card,
      .table-header {
        grid-template-columns: 1fr;
        display: grid;
      }

      .summary-grid,
      .insight-grid,
      .filters {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 640px) {
      .summary-grid,
      .insight-grid,
      .filters,
      .district-list {
        grid-template-columns: 1fr;
      }

      .grid-wrap {
        height: 560px;
      }
    }
  `]
})
export class BoardInstitutesComponent implements OnInit {
  readonly institutes = signal<Institute[]>([]);
  readonly dashboard = signal<Dashboard | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly filterVersion = signal(0);

  search = '';
  statusFilter = '';
  districtFilter = '';
  boardTypeFilter = '';

  readonly columnDefs: ColDef[] = [
    { headerName: 'Institute', field: 'name', flex: 1.8, minWidth: 260 },
    { headerName: 'Board', field: 'boardType', width: 105 },
    { headerName: 'Status', field: 'status', width: 135 },
    { headerName: 'District', field: 'district', width: 170 },
    { headerName: 'City', field: 'city', width: 150 },
    { headerName: 'Code', field: 'code', width: 150 },
    { headerName: 'College No', field: 'collegeNo', width: 150 },
    { headerName: 'UDISE', field: 'udiseNo', width: 150 },
    {
      headerName: 'Accepting',
      field: 'acceptingApplications',
      width: 125,
      valueFormatter: (params) => params.value ? 'YES' : 'NO'
    },
    { headerName: 'Contact', field: 'contactMobile', width: 150 },
    { headerName: 'Email', field: 'contactEmail', minWidth: 220 }
  ];

  readonly defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true
  };

  readonly filteredInstitutes = computed(() => {
    this.filterVersion();
    const term = this.search.trim().toLowerCase();
    return this.institutes().filter((item) => {
      const matchesTerm = !term || [
        item.name,
        item.code,
        item.collegeNo,
        item.udiseNo,
        item.district,
        item.city,
        item.contactMobile,
        item.contactEmail,
        item.boardType,
        item.status
      ].some((value) => String(value || '').toLowerCase().includes(term));

      return matchesTerm
        && (!this.statusFilter || item.status === this.statusFilter)
        && (!this.districtFilter || (item.district || 'UNKNOWN') === this.districtFilter)
        && (!this.boardTypeFilter || (item.boardType || 'HSC') === this.boardTypeFilter);
    });
  });

  readonly statusOptions = computed(() => [...new Set(this.institutes().map((item) => item.status || 'UNKNOWN'))].sort());
  readonly districtOptions = computed(() => [...new Set(this.institutes().map((item) => item.district || 'UNKNOWN'))].sort());
  readonly boardTypeOptions = computed(() => [...new Set(this.institutes().map((item) => item.boardType || 'HSC'))].sort());
  readonly topDistricts = computed(() => (this.dashboard()?.byDistrict || []).slice(0, 12));
  readonly statusBreakdown = computed(() => Object.entries(this.dashboard()?.byStatus || {}).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count));
  readonly boardTypeBreakdown = computed(() => Object.entries(this.dashboard()?.byBoardType || {}).map(([type, count]) => ({ type, count })).sort((a, b) => a.type.localeCompare(b.type)));

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.http.get<{ institutes: Institute[]; dashboard: Dashboard }>(`${API_BASE_URL}/institutes/board/summary`).subscribe({
      next: (response) => {
        this.institutes.set(response.institutes || []);
        this.dashboard.set(response.dashboard || null);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error?.error?.message || error?.error?.error || 'Unable to load institute dashboard.');
        this.loading.set(false);
      }
    });
  }

  clearFilters(): void {
    this.search = '';
    this.statusFilter = '';
    this.districtFilter = '';
    this.boardTypeFilter = '';
    this.refreshFilters();
  }

  setDistrictFilter(district: string): void {
    this.districtFilter = district;
    this.refreshFilters();
  }

  refreshFilters(): void {
    this.filterVersion.update((value) => value + 1);
  }
}
