import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { TableExportService } from '../../core/table-export.service';

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

interface TableAction {
  label: string;
  icon: string;
  action: (row: any) => void;
}

/**
 * Enhanced data table wrapper component with export/print/filter features
 * Provides: Export (CSV, Excel), Print, Search, Column filtering, Responsive design
 * Usage: Import and wrap your existing ag-grid or mat-table components
 */
@Component({
  selector: 'app-enhanced-table',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule
  ],
  template: `
    <div class="enhanced-table-wrapper">
      <!-- Toolbar -->
      <div class="table-toolbar">
        <div class="toolbar-left">
          <h3 class="table-title">{{ title() }}</h3>
          @if (subtitle()) {
            <p class="table-subtitle">{{ subtitle() }}</p>
          }
        </div>
        <div class="toolbar-right">
          <!-- Search -->
          @if (showSearch()) {
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search</mat-label>
              <input 
                matInput 
                [value]="searchText()" 
                (input)="handleSearch($any($event.target).value)"
                [placeholder]="searchPlaceholder()"
              />
            </mat-form-field>
          }

          <!-- Filters -->
          @if (filters().length > 0) {
            @for (filter of filters(); track filter.key) {
              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>{{ filter.label }}</mat-label>
                @if (filter.type === 'select') {
                  <mat-select [value]="filter.value" (selectionChange)="handleFilterChange(filter.key, $event.value)">
                    @for (opt of filter.options; track opt) {
                      <mat-option [value]="opt">{{ opt }}</mat-option>
                    }
                  </mat-select>
                } @else {
                  <input matInput [value]="filter.value" (input)="handleFilterChange(filter.key, $any($event.target).value)" />
                }
              </mat-form-field>
            }
          }

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button 
              mat-icon-button 
              matTooltip="Export CSV"
              (click)="exportCSV()"
              class="export-btn"
            >
              <mat-icon>download</mat-icon>
            </button>
            <button 
              mat-icon-button 
              matTooltip="Export Excel"
              (click)="exportExcel()"
              class="export-btn"
            >
              <mat-icon>table_chart</mat-icon>
            </button>
            <button 
              mat-icon-button 
              matTooltip="Print"
              (click)="print()"
              class="print-btn"
            >
              <mat-icon>print</mat-icon>
            </button>
            <button 
              mat-icon-button 
              matTooltip="Refresh"
              (click)="onRefresh.emit()"
              class="refresh-btn"
            >
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Table Stats -->
      @if (showStats()) {
        <div class="table-stats">
          <span class="stat-item">
            <strong>{{ filteredData().length }}</strong> of <strong>{{ rows().length }}</strong> records
          </span>
          @if (selectedRows().length > 0) {
            <span class="stat-item">
              <strong>{{ selectedRows().length }}</strong> selected
              <button mat-icon-button (click)="clearSelection()">
                <mat-icon>close</mat-icon>
              </button>
            </span>
          }
        </div>
      }

      <!-- Content Slot -->
      <ng-content></ng-content>

      <!-- Status Messages -->
      @if (successMessage()) {
        <div class="status-success">
          <mat-icon>check_circle</mat-icon>
          {{ successMessage() }}
        </div>
      }
      @if (errorMessage()) {
        <div class="status-error">
          <mat-icon>error</mat-icon>
          {{ errorMessage() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .enhanced-table-wrapper {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* Toolbar */
    .table-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
      padding: 12px;
      background: var(--panel);
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
    }

    .toolbar-left {
      flex: 1;
      min-width: 200px;
    }

    .table-title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text);
    }

    .table-subtitle {
      margin: 4px 0 0;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .toolbar-right {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-field,
    .filter-field {
      width: 180px;
      max-width: 100%;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }

    .action-buttons button {
      transition: all var(--transition);
    }

    .action-buttons button:hover {
      transform: scale(1.1);
    }

    .export-btn {
      color: #2563eb !important;
    }

    .print-btn {
      color: #059669 !important;
    }

    .refresh-btn {
      color: #7c3aed !important;
    }

    /* Stats */
    .table-stats {
      display: flex;
      gap: 16px;
      padding: 8px 12px;
      background: var(--surface-alt);
      border-radius: var(--radius-md);
      font-size: 0.9rem;
      color: var(--text-secondary);
      flex-wrap: wrap;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .stat-item button {
      margin-left: 4px;
    }

    /* Status Messages */
    .status-success,
    .status-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      font-weight: 500;
      animation: slideDown 0.3s ease-out;
    }

    .status-success {
      background: #d1fae5;
      color: #065f46;
      border-left: 4px solid #10b981;
    }

    .status-error {
      background: #fee2e2;
      color: #991b1b;
      border-left: 4px solid #ef4444;
    }

    .status-success mat-icon,
    .status-error mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    @media (max-width: 768px) {
      .table-toolbar {
        flex-direction: column;
        align-items: stretch;
      }

      .toolbar-right {
        flex-direction: column;
      }

      .search-field,
      .filter-field {
        width: 100%;
      }
    }
  `]
})
export class EnhancedTableComponent {
  // Inputs
  title = input<string>('Data Table');
  subtitle = input<string>('');
  rows = input<any[]>([]);
  columns = input<TableColumn[]>([]);
  showSearch = input(true);
  showStats = input(true);
  searchPlaceholder = input('Search...');
  filters = input<any[]>([]);

  // Outputs
  onRefresh = output<void>();
  searchChange = output<string>();
  filterChange = output<{ key: string; value: any }>();
  onSelectionChange = output<any[]>();

  // State
  searchText = signal('');
  selectedRows = signal<any[]>([]);
  successMessage = signal('');
  errorMessage = signal('');

  filteredData = computed(() => {
    let data = this.rows();
    const search = this.searchText().toLowerCase();

    if (search) {
      data = data.filter((row: any) =>
        Object.values(row).some(val =>
          String(val).toLowerCase().includes(search)
        )
      );
    }

    return data;
  });

  constructor(private tableExport: TableExportService) {}

  handleSearch(value: string) {
    this.searchText.set(value);
    this.searchChange.emit(value);
  }

  handleFilterChange(key: string, value: any) {
    this.filterChange.emit({ key, value });
  }

  exportCSV() {
    this.tableExport.exportToCSV(
      this.filteredData(),
      this.columns(),
      'export'
    );
    this.showSuccess('Exported to CSV successfully');
  }

  async exportExcel() {
    await this.tableExport.exportToExcel(
      this.filteredData(),
      this.columns(),
      'export'
    );
    this.showSuccess('Exported to Excel successfully');
  }

  print() {
    this.tableExport.printTable(
      this.filteredData(),
      this.columns(),
      this.title()
    );
  }

  clearSelection() {
    this.selectedRows.set([]);
    this.onSelectionChange.emit([]);
  }

  private showSuccess(message: string) {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(''), 4000);
  }

  showError(message: string) {
    this.errorMessage.set(message);
    setTimeout(() => this.errorMessage.set(''), 4000);
  }
}
