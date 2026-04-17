import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

export type BoardExamOption = {
  id: number;
  name: string;
  session: string;
  academicYear: string;
};

@Component({
  selector: 'app-board-exam-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule],
  template: `
    <mat-form-field appearance="outline" class="exam-selector" [class.exam-selector--compact]="compact">
      <mat-label>{{ label }}</mat-label>
      <mat-select [ngModel]="selectedExamId" (ngModelChange)="onSelect($event)" [panelClass]="panelClass">
        <mat-option [value]="''">{{ allLabel }}</mat-option>
        <mat-option *ngFor="let exam of exams" [value]="toExamValue(exam.id)">
          {{ exam.name }} - {{ exam.session }} {{ exam.academicYear }}
        </mat-option>
      </mat-select>
    </mat-form-field>
  `,
  styles: [
    `
      .exam-selector {
        width: 300px;
        max-width: 100%;
      }

      .exam-selector--compact {
        width: 260px;
      }
    `
  ]
})
export class BoardExamSelectorComponent {
  @Input() exams: BoardExamOption[] = [];
  @Input() selectedExamId: string | number | null = '';
  @Input() label = 'Exam';
  @Input() allLabel = 'All exams';
  @Input() panelClass = 'board-exam-selector-panel';
  @Input() compact = false;

  @Output() selectedExamIdChange = new EventEmitter<string>();

  toExamValue(value: number | string | null | undefined): string {
    return `${value ?? ''}`;
  }

  onSelect(value: string | number | null | undefined) {
    this.selectedExamIdChange.emit(this.toExamValue(value));
  }
}
