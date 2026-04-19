import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { InstituteExamCapacityGridComponent } from '../institute-settings/institute-exam-capacity-grid.component';

@Component({
  selector: 'app-institute-exam-capacity-page',
  standalone: true,
  imports: [MatCardModule, InstituteExamCapacityGridComponent],
  template: `
    <mat-card class="page-card">
      <div class="title">Exam-wise Student Capacity</div>
      <div class="subtitle">Manage stream-wise intake limits for each exam from a dedicated page. The table combines session and academic year for quicker review.</div>
    </mat-card>

    <app-institute-exam-capacity-grid></app-institute-exam-capacity-grid>
  `,
  styles: [
    `.page-card { margin-bottom: 14px; padding: 18px; }`,
    `.title { font-size: 1.1rem; font-weight: 800; margin-bottom: 6px; }`,
    `.subtitle { color: #6b7280; line-height: 1.45; }`
  ]
})
export class InstituteExamCapacityPageComponent {}
