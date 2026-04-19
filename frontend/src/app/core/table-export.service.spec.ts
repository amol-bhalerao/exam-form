import { TestBed } from '@angular/core/testing';
import { TableExportService } from './table-export.service';

describe('TableExportService', () => {
  let service: TableExportService;
  let downloadFileSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableExportService);
    // Spy on downloadFile method
    downloadFileSpy = spyOn<any>(service, 'downloadFile');;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('exportToCSV', () => {
    it('should export data to CSV format', () => {
      const data = [
        { id: 1, name: 'John', email: 'john@test.com' },
        { id: 2, name: 'Jane', email: 'jane@test.com' }
      ];
      const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' }
      ];

      service.exportToCSV(data, columns, 'test');

      expect(downloadFileSpy).toHaveBeenCalled();
      const [csvContent, filename] = downloadFileSpy.calls.mostRecent().args;
      
      expect(filename).toBe('test.csv');
      expect(csvContent).toContain('ID,Name,Email');
      expect(csvContent).toContain('John');
      expect(csvContent).toContain('jane@test.com');
    });

    it('should handle empty data', () => {
      spyOn(window, 'alert');
      service.exportToCSV([], [], 'test');
      expect(window.alert).toHaveBeenCalledWith('No data to export');
    });

    it('should escape quotes in CSV data', () => {
      const data = [{ name: 'John "Johnny" Doe' }];
      const columns = [{ key: 'name', label: 'Name' }];

      service.exportToCSV(data, columns);

      const [csvContent] = downloadFileSpy.calls.mostRecent().args;
      expect(csvContent).toContain('John ""Johnny"" Doe');
    });

    it('should handle nested object values', () => {
      const data = [
        { user: { name: 'John', email: 'john@test.com' } }
      ];
      const columns = [
        { key: 'user.name', label: 'Name' },
        { key: 'user.email', label: 'Email' }
      ];

      service.exportToCSV(data, columns);

      const [csvContent] = downloadFileSpy.calls.mostRecent().args;
      expect(csvContent).toContain('John');
      expect(csvContent).toContain('john@test.com');
    });
  });

  describe('printTable', () => {
    it('should open print window', () => {
      const openSpy = spyOn(window, 'open').and.returnValue({
        document: { write: jasmine.createSpy(), close: jasmine.createSpy() },
        print: jasmine.createSpy(),
        close: jasmine.createSpy()
      } as any);

      const data = [{ id: 1, name: 'John' }];
      const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' }
      ];

      service.printTable(data, columns, 'Test Report');

      expect(openSpy).toHaveBeenCalled();
    });

    it('should alert when data is empty', () => {
      spyOn(window, 'alert');
      service.printTable([], [], 'Test');
      expect(window.alert).toHaveBeenCalledWith('No data to print');
    });
  });
});
