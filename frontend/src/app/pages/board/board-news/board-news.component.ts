import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { API_BASE_URL } from '../../../core/api';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  type: 'news' | 'event' | 'notification';
  createdAt: string;
  updatedAt: string;
}

interface NewsForm {
  title: string;
  content: string;
  type: 'news' | 'event' | 'notification';
}

@Component({
  selector: 'app-board-news',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="news-management">
      <mat-card class="header-card">
        <div class="header-content">
          <div>
            <h1>News & Announcements Management</h1>
            <p>Manage news, events, and notifications for the portal</p>
          </div>
          <button mat-raised-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            Add New Item
          </button>
        </div>
      </mat-card>

      <mat-card class="table-card">
        <table mat-table [dataSource]="newsItems()" class="news-table">
          <!-- Title Column -->
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>Title</th>
            <td mat-cell *matCellDef="let item">{{ item.title }}</td>
          </ng-container>

          <!-- Type Column -->
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Type</th>
            <td mat-cell *matCellDef="let item">
              <span class="type-badge" [ngClass]="item.type">
                {{ item.type.toUpperCase() }}
              </span>
            </td>
          </ng-container>

          <!-- Created Date Column -->
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Created</th>
            <td mat-cell *matCellDef="let item">{{ formatDate(item.createdAt) }}</td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let item">
              <button mat-icon-button (click)="openEditDialog(item)" title="Edit">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteItem(item.id)" title="Delete">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <div *ngIf="newsItems().length === 0" class="no-data">
          <mat-icon>info</mat-icon>
          <p>No news items found. Create your first announcement!</p>
        </div>
      </mat-card>

      <div class="app-modal-backdrop" *ngIf="showForm()">
        <mat-card class="dialog-card app-modal-panel app-modal-panel--md">
          <div class="dialog-top">
            <mat-card-title>{{ isEditing() ? 'Edit' : 'Create' }} News Item</mat-card-title>
            <button mat-icon-button type="button" aria-label="Close dialog" (click)="closeDialog()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <mat-card-content>
            <form (ngSubmit)="saveItem()" class="news-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Title</mat-label>
                <input matInput [(ngModel)]="newsForm.title" name="title" required>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Type</mat-label>
                <mat-select [(ngModel)]="newsForm.type" name="type" required>
                  <mat-option value="news">News</mat-option>
                  <mat-option value="event">Event</mat-option>
                  <mat-option value="notification">Notification</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Content</mat-label>
                <textarea matInput [(ngModel)]="newsForm.content" name="content" rows="4" required></textarea>
              </mat-form-field>
            </form>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-button (click)="closeDialog()">Cancel</button>
            <button mat-raised-button color="primary" (click)="saveItem()" [disabled]="!newsForm.title || !newsForm.content">
              {{ isEditing() ? 'Update' : 'Create' }}
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styleUrls: ['./board-news.component.scss']
})
export class BoardNewsComponent implements OnInit {
  newsItems = signal<NewsItem[]>([]);
  displayedColumns = ['title', 'type', 'createdAt', 'actions'];

  newsForm: NewsForm = { title: '', content: '', type: 'news' };
  isEditing = signal(false);
  editingId: number | null = null;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadNewsItems();
  }

  loadNewsItems() {
    this.http.get<{ news: NewsItem[] }>(`${API_BASE_URL}/news`).subscribe({
      next: (response) => this.newsItems.set(response.news),
      error: () => this.showError('Failed to load news items')
    });
  }

  showForm = signal(false);

  openCreateDialog() {
    this.isEditing.set(false);
    this.editingId = null;
    this.newsForm = { title: '', content: '', type: 'news' };
    this.showForm.set(true);
  }

  openEditDialog(item: NewsItem) {
    this.isEditing.set(true);
    this.editingId = item.id;
    this.newsForm = {
      title: item.title,
      content: item.content,
      type: item.type
    };
    this.showForm.set(true);
  }

  closeDialog() {
    this.showForm.set(false);
  }

  saveItem() {
    if (!this.newsForm.title || !this.newsForm.content) return;

    const url = this.isEditing()
      ? `${API_BASE_URL}/news/${this.editingId}`
      : `${API_BASE_URL}/news`;

    const method = this.isEditing() ? 'put' : 'post';

    this.http[method](url, this.newsForm).subscribe({
      next: () => {
        this.showSuccess(`News item ${this.isEditing() ? 'updated' : 'created'} successfully`);
        this.loadNewsItems();
        this.closeDialog();
      },
      error: () => this.showError(`Failed to ${this.isEditing() ? 'update' : 'create'} news item`)
    });
  }

  deleteItem(id: number) {
    if (!confirm('Are you sure you want to delete this news item?')) return;

    this.http.delete(`${API_BASE_URL}/news/${id}`).subscribe({
      next: () => {
        this.showSuccess('News item deleted successfully');
        this.loadNewsItems();
      },
      error: () => this.showError('Failed to delete news item')
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', { duration: 5000, panelClass: 'error-snackbar' });
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', { duration: 3000, panelClass: 'success-snackbar' });
  }
}
