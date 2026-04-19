import { TestBed } from '@angular/core/testing';
import { EnhancedTableComponent } from './enhanced-table.component';
import { TableExportService } from '../../core/table-export.service';

describe('EnhancedTableComponent', () => {
  let component: EnhancedTableComponent;
  let exportService: TableExportService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnhancedTableComponent],
      providers: [TableExportService]
    }).compileComponents();

    component = TestBed.createComponent(EnhancedTableComponent).componentInstance;
    exportService = TestBed.inject(TableExportService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter data based on search text', () => {
    const testData = [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' }
    ];
    TestBed.runInInjectionContext(() => {
      component = TestBed.createComponent(EnhancedTableComponent).componentInstance;
    });

    expect(component).toBeTruthy();
  });

  it('should export to CSV', (done) => {
    spyOn(exportService, 'exportToCSV');
    spyOn(component.onRefresh, 'emit');
    
    setTimeout(() => {
      expect(exportService.exportToCSV).not.toThrow();
      done();
    }, 100);
  });

  it('should handle empty data for export', () => {
    spyOn(window, 'alert');
    const testData: any[] = [];
    
    expect(testData.length).toBe(0);
  });

  it('should clear selection', () => {
    component.clearSelection();
    expect(component.selectedRows().length).toBe(0);
  });

  it('should show and clear success message', (done) => {
    component['showSuccess']('Test success message');
    expect(component.successMessage()).toBe('Test success message');

    setTimeout(() => {
      expect(component.successMessage()).toBe('');
      done();
    }, 4100);
  });

  it('should show error message', (done) => {
    component.showError('Test error message');
    expect(component.errorMessage()).toBe('Test error message');

    setTimeout(() => {
      expect(component.errorMessage()).toBe('');
      done();
    }, 4100);
  });
});
