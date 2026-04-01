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
  `
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
