import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TableExportService {
  
  /**
   * Export table data to CSV (Excel compatible)
   */
  exportToCSV(
    data: any[],
    columns: { key: string; label: string }[],
    filename: string = 'export.csv'
  ) {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    // Create CSV headers
    const headers = columns.map(col => `"${col.label}"`).join(',');

    // Create CSV rows
    const rows = data.map(row => {
      return columns
        .map(col => {
          const value = this.getNestedValue(row, col.key);
          const escaped = String(value ?? '')
            .replace(/"/g, '""')
            .replace(/\n/g, ' ');
          return `"${escaped}"`;
        })
        .join(',');
    });

    const csv = [headers, ...rows].join('\n');
    this.downloadFile(csv, `${filename}.csv`, 'text/csv');
  }

  /**
   * Export table data to Excel (XLSX format)
   * Requires: npm install xlsx
   */
  async exportToExcel(
    data: any[],
    columns: { key: string; label: string }[],
    filename: string = 'export'
  ) {
    try {
      // Dynamically import xlsx
      const XLSX = await import('xlsx');

      if (!data || data.length === 0) {
        alert('No data to export');
        return;
      }

      // Prepare data for Excel
      const excelData = data.map(row => {
        const obj: any = {};
        columns.forEach(col => {
          obj[col.label] = this.getNestedValue(row, col.key);
        });
        return obj;
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');

      // Auto-fit column widths
      const maxWidth = 50;
      const colWidths = columns.map(col => ({
        wch: Math.min(maxWidth, col.label.length + 2)
      }));
      ws['!cols'] = colWidths;

      // Write to file
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (error) {
      // Export to Excel failed
      // Fallback to CSV
      this.exportToCSV(data, columns, filename);
    }
  }

  /**
   * Print table with custom styling
   */
  printTable(
    data: any[],
    columns: { key: string; label: string }[],
    title: string = 'Report'
  ) {
    if (!data || data.length === 0) {
      alert('No data to print');
      return;
    }

    const printWindow = window.open('', '', 'width=1200,height=800');
    if (!printWindow) return;

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Roboto, sans-serif; 
            background: white;
            padding: 20px;
            color: #333;
          }
          h1 { 
            margin-bottom: 20px; 
            font-size: 24px; 
            text-align: center;
            color: #1d4ed8;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
          }
          thead { 
            background: #1d4ed8; 
            color: white; 
          }
          th { 
            padding: 12px; 
            text-align: left; 
            font-weight: 600;
            border: 1px solid #ddd;
          }
          td { 
            padding: 10px 12px; 
            border: 1px solid #ddd;
          }
          tr:nth-child(even) { 
            background: #f8fafc; 
          }
          tr:hover { 
            background: #e0e7ff; 
          }
          @media print {
            body { padding: 10px; }
            h1 { margin-bottom: 10px; }
            table { font-size: 11px; }
            th, td { padding: 6px; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${col.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                row =>
                  `<tr>
              ${columns.map(col => `<td>${this.getNestedValue(row, col.key) ?? '-'}</td>`).join('')}
            </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  /**
   * Get nested object value by dot notation key (e.g., 'user.name')
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Download file helper
   */
  private downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
