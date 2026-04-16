import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-student-image-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="asset-card" [class.signature-card]="type === 'signature'">
      <div class="asset-head">
        <div>
          <h3>{{ title }}</h3>
          <p>{{ hint }}</p>
        </div>
        <span class="size-badge">≤ {{ maxSizeKB }} KB</span>
      </div>

      <ng-container *ngIf="previewUrl(); else uploadHintTpl">
        <div
          class="asset-preview"
          [class.signature-preview]="type === 'signature'"
          [style.width.px]="editorDimensions().width"
          [style.height.px]="editorDimensions().height"
        >
          <img
            [src]="previewUrl()!"
            [alt]="title"
            [class.signature-image]="type === 'signature'"
            [style.max-width.px]="editorDimensions().width"
            [style.max-height.px]="editorDimensions().height"
            (error)="handlePreviewImageError()"
          />
        </div>
      </ng-container>

      <ng-template #uploadHintTpl>
        <div class="upload-empty-state" [class.signature-empty-state]="type === 'signature'">
          <div class="placeholder-state">
            <mat-icon>{{ type === 'photo' ? 'account_box' : 'draw' }}</mat-icon>
            <span>{{ type === 'photo' ? 'फोटो अपलोड झाल्यावर येथे दिसेल' : 'स्वाक्षरी अपलोड झाल्यावर येथे दिसेल' }}</span>
          </div>
        </div>
      </ng-template>

      <div class="asset-guidelines">
        <span>{{ type === 'photo' ? 'Plain light background' : 'Dark ink on white background' }}</span>
      </div>

      <div class="asset-meta" *ngIf="sizeLabel()">
        Optimized size: <strong>{{ sizeLabel() }}</strong>
      </div>

      <div class="asset-actions">
        <input
          #fileInput
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          (change)="onFileSelected($event)"
        />

        <button mat-raised-button color="primary" type="button" (click)="openPicker()" [disabled]="processing() || saving">
          <mat-icon>{{ previewUrl() ? 'edit' : 'upload' }}</mat-icon>
          {{ previewUrl() ? 'बदला' : 'अपलोड करा' }}
        </button>

        <button mat-stroked-button type="button" *ngIf="previewUrl()" (click)="removeExisting()" [disabled]="processing() || saving">
          <mat-icon>delete</mat-icon>
          काढा
        </button>
      </div>

      <div class="asset-error" *ngIf="error()">{{ error() }}</div>

      <div class="crop-panel" *ngIf="editorOpen()">
        <div
          class="crop-stage"
          [class.signature-stage]="type === 'signature'"
          [style.width.px]="editorDimensions().width"
          [style.height.px]="editorDimensions().height"
        >
          <canvas
            #editorCanvas
            [attr.width]="editorDimensions().width"
            [attr.height]="editorDimensions().height"
            [style.width.px]="editorDimensions().width"
            [style.height.px]="editorDimensions().height"
          ></canvas>
          <div class="guide-frame" [class.signature-guide]="type === 'signature'"></div>
        </div>

        <div class="control-grid">
          <label>
            <span>Zoom</span>
            <input type="range" min="1" max="3" step="0.05" [(ngModel)]="zoom" (input)="renderEditorPreview()" [disabled]="type === 'photo' && keepOriginalPhoto" />
          </label>
          <label>
            <span>Move Left / Right</span>
            <input type="range" min="-100" max="100" step="1" [(ngModel)]="offsetX" (input)="renderEditorPreview()" [disabled]="type === 'photo' && keepOriginalPhoto" />
          </label>
          <label>
            <span>Move Up / Down</span>
            <input type="range" min="-100" max="100" step="1" [(ngModel)]="offsetY" (input)="renderEditorPreview()" [disabled]="type === 'photo' && keepOriginalPhoto" />
          </label>
        </div>

        <label class="original-toggle" *ngIf="type === 'photo'">
          <input type="checkbox" [(ngModel)]="keepOriginalPhoto" (change)="renderEditorPreview()" />
          <span>Keep original proportions (no crop), optimize only file size</span>
        </label>

        <p class="crop-note">
          Follow the guide frame while adjusting the image. It will be resized to the correct hall-ticket shape and optimized automatically below {{ maxSizeKB }} KB.
        </p>

        <div class="editor-actions">
          <button mat-stroked-button type="button" (click)="cancelEditing()" [disabled]="processing() || saving">Cancel</button>
          <button mat-flat-button color="primary" type="button" (click)="saveCroppedImage()" [disabled]="processing() || saving">
            <mat-spinner *ngIf="processing() || saving" diameter="18"></mat-spinner>
            <mat-icon *ngIf="!processing() && !saving">check</mat-icon>
            {{ processing() || saving ? 'Optimizing...' : 'Use This Image' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .asset-card {
      border: 1px solid #dbe3f1;
      border-radius: 16px;
      padding: 1rem;
      background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
    }

    .asset-head {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      align-items: flex-start;
      margin-bottom: 0.85rem;
    }

    .asset-head h3 {
      margin: 0 0 0.2rem;
      font-size: 1rem;
      color: #0f172a;
    }

    .asset-head p {
      margin: 0;
      color: #64748b;
      font-size: 0.85rem;
      line-height: 1.45;
    }

    .size-badge {
      flex-shrink: 0;
      padding: 0.22rem 0.55rem;
      border-radius: 999px;
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .asset-preview {
      border: 1.5px dashed #93c5fd;
      border-radius: 12px;
      background: #f8fbff;
      display: grid;
      place-items: center;
      overflow: hidden;
      margin: 0 auto;
    }

    .signature-preview {
      background: #f8fbff;
    }

    .upload-empty-state {
      min-height: 132px;
      border: 1.5px dashed #bfd5ff;
      border-radius: 12px;
      background: linear-gradient(180deg, #f8fbff 0%, #f2f7ff 100%);
      display: grid;
      place-items: center;
      padding: 0.75rem;
    }

    .signature-empty-state {
      min-height: 92px;
    }

    .asset-preview img {
      object-fit: contain;
      display: block;
    }

    .signature-image {
      object-fit: contain !important;
      padding: 0.35rem;
      background: #fff;
    }

    .asset-guidelines {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
      margin-top: 0.6rem;
    }

    .asset-guidelines span {
      padding: 0.2rem 0.5rem;
      border-radius: 999px;
      background: #eef4ff;
      color: #334155;
      font-size: 0.74rem;
      font-weight: 600;
    }

    .placeholder-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.45rem;
      color: #64748b;
      padding: 0.75rem;
      text-align: center;
    }

    .placeholder-state mat-icon {
      font-size: 30px;
      width: 30px;
      height: 30px;
      color: #3b82f6;
    }

    .asset-meta {
      margin-top: 0.55rem;
      font-size: 0.8rem;
      color: #475569;
    }

    .asset-actions,
    .editor-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
      margin-top: 0.85rem;
    }

    .asset-error {
      margin-top: 0.6rem;
      padding: 0.55rem 0.7rem;
      border-radius: 10px;
      background: #fef2f2;
      color: #b91c1c;
      font-size: 0.82rem;
    }

    .crop-panel {
      margin-top: 1rem;
      border-top: 1px solid #e2e8f0;
      padding-top: 0.9rem;
    }

    .crop-stage {
      position: relative;
      border-radius: 12px;
      border: 1px solid #cbd5e1;
      background: repeating-conic-gradient(#f8fafc 0% 25%, #eef2f7 0% 50%) 50% / 18px 18px;
      display: grid;
      place-items: center;
      overflow: hidden;
      margin: 0 auto;
    }

    .signature-stage {
      border-radius: 10px;
    }

    .crop-stage canvas {
      display: block;
    }

    .guide-frame {
      position: absolute;
      inset: 14px;
      border: 2px solid rgba(37, 99, 235, 0.6);
      border-radius: 14px;
      box-shadow: 0 0 0 999px rgba(15, 23, 42, 0.08);
      pointer-events: none;
    }

    .signature-guide {
      inset: 26px 18px;
      border-radius: 10px;
    }

    .control-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-top: 0.9rem;
    }

    .control-grid label {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.82rem;
      color: #334155;
      font-weight: 600;
    }

    .control-grid input[type='range'] {
      width: 100%;
      accent-color: #2563eb;
    }

    .original-toggle {
      margin-top: 0.7rem;
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.82rem;
      color: #334155;
      font-weight: 600;
    }

    .crop-note {
      margin: 0.75rem 0 0;
      font-size: 0.8rem;
      color: #64748b;
      line-height: 1.45;
    }

    @media (max-width: 768px) {
      .control-grid {
        grid-template-columns: 1fr;
      }

      .asset-preview {
        margin: 0 auto;
      }

      .signature-preview {
        margin: 0 auto;
      }

      .crop-stage {
        margin: 0 auto;
      }

      .signature-stage {
        margin: 0 auto;
      }
    }
  `]
})
export class StudentImageUploadComponent implements OnChanges {
  @Input() type: 'photo' | 'signature' = 'photo';
  @Input() title = 'Student Photo';
  @Input() hint = '50KB पेक्षा कमी आकाराचे फोटो अपलोड करा';
  @Input() imageUrl: string | null = null;
  @Input() maxSizeKB = 50;
  @Input() saving = false;

  @Output() saved = new EventEmitter<{ type: 'photo' | 'signature'; dataUrl: string; sizeKB: number }>();
  @Output() removed = new EventEmitter<'photo' | 'signature'>();

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('editorCanvas') editorCanvas?: ElementRef<HTMLCanvasElement>;

  readonly previewUrl = signal<string | null>(null);
  readonly editorOpen = signal(false);
  readonly processing = signal(false);
  readonly error = signal<string | null>(null);
  readonly sizeLabel = signal<string>('');

  zoom = 1;
  offsetX = 0;
  offsetY = 0;
  keepOriginalPhoto = false;

  private sourceImage: HTMLImageElement | null = null;
  private previousPreviewUrl: string | null = null;
  private lastLocalSavedPreview: string | null = null;

  private static readonly MOBILE_BREAKPOINT = 768;
  private static readonly DIMENSIONS = {
    photo: {
      desktop: { width: 240, height: 300 },
      mobile: { width: 200, height: 250 }
    },
    signature: {
      desktop: { width: 360, height: 120 },
      mobile: { width: 300, height: 100 }
    }
  } as const;

  readonly viewportWidth = signal(typeof window !== 'undefined' ? window.innerWidth : 1280);

  @HostListener('window:resize')
  onWindowResize(): void {
    this.viewportWidth.set(window.innerWidth);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl']) {
      this.previewUrl.set(this.imageUrl || this.previewUrl() || null);
    }
  }

  handlePreviewImageError(): void {
    // If remote URL fails, keep a working local preview so user can still see the image they saved.
    if (this.lastLocalSavedPreview && this.previewUrl() !== this.lastLocalSavedPreview) {
      this.previewUrl.set(this.lastLocalSavedPreview);
      return;
    }
    this.error.set('Image preview could not be loaded from server.');
  }

  openPicker(): void {
    this.error.set(null);
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.error.set('Please select a valid image file.');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      this.error.set('Please upload an image smaller than 12 MB before optimization.');
      return;
    }

    this.previousPreviewUrl = this.previewUrl();

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const image = new Image();
      image.onload = () => {
        this.sourceImage = image;
        this.previewUrl.set(dataUrl);
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.keepOriginalPhoto = false;
        this.error.set(null);
        this.editorOpen.set(true);
        setTimeout(() => this.renderEditorPreview(), 0);
      };
      image.onerror = () => {
        this.previewUrl.set(this.previousPreviewUrl);
        this.error.set('The selected image could not be loaded.');
      };
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  editorDimensions() {
    const breakpoint = StudentImageUploadComponent.MOBILE_BREAKPOINT;
    const mode = this.viewportWidth() <= breakpoint ? 'mobile' : 'desktop';
    return StudentImageUploadComponent.DIMENSIONS[this.type][mode];
  }

  renderEditorPreview(): void {
    const canvas = this.editorCanvas?.nativeElement;
    const image = this.sourceImage;
    if (!canvas || !image) return;

    const dimensions = this.editorDimensions();
    const width = dimensions.width;
    const height = dimensions.height;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, width, height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);

    const baseScale = Math.max(width / image.width, height / image.height);
    const scale = baseScale * this.zoom;
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const x = (width - drawWidth) / 2 + (this.offsetX / 100) * width * 0.35;
    const y = (height - drawHeight) / 2 + (this.offsetY / 100) * height * 0.35;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, x, y, drawWidth, drawHeight);
  }

  cancelEditing(): void {
    this.editorOpen.set(false);
    this.previewUrl.set(this.previousPreviewUrl);
    this.error.set(null);
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  async saveCroppedImage(): Promise<void> {
    try {
      this.processing.set(true);
      this.error.set(null);

      const result = this.type === 'photo' && this.keepOriginalPhoto
        ? await this.exportCompressedOriginalImage()
        : await this.exportCompressedImage();
      this.previewUrl.set(result.dataUrl);
      this.lastLocalSavedPreview = result.dataUrl;
      this.previousPreviewUrl = result.dataUrl;
      this.sizeLabel.set(`${result.sizeKB.toFixed(1)} KB`);
      this.editorOpen.set(false);
      this.sourceImage = null;
      this.saved.emit({ type: this.type, dataUrl: result.dataUrl, sizeKB: result.sizeKB });
    } catch (error: any) {
      this.error.set(error?.message || 'Unable to optimize this image. Please try a different file.');
    } finally {
      this.processing.set(false);
      if (this.fileInput?.nativeElement) {
        this.fileInput.nativeElement.value = '';
      }
    }
  }

  removeExisting(): void {
    this.previewUrl.set(null);
    this.previousPreviewUrl = null;
    this.lastLocalSavedPreview = null;
    this.sizeLabel.set('');
    this.error.set(null);
    this.editorOpen.set(false);
    this.sourceImage = null;
    this.removed.emit(this.type);
  }

  private async exportCompressedImage(): Promise<{ dataUrl: string; sizeKB: number }> {
    const sourceCanvas = this.editorCanvas?.nativeElement;
    if (!sourceCanvas) {
      throw new Error('Crop preview is not available.');
    }

    const maxBytes = this.maxSizeKB * 1024;
    const scales = [1, 0.92, 0.84, 0.76, 0.68, 0.6, 0.52, 0.44, 0.36];
    const qualities = [0.86, 0.78, 0.7, 0.62, 0.54, 0.46, 0.38, 0.32, 0.26, 0.22];
    let fallbackBlob: Blob | null = null;

    for (const scale of scales) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(40, Math.round(sourceCanvas.width * scale));
      canvas.height = Math.max(24, Math.round(sourceCanvas.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);

      for (const quality of qualities) {
        const blob = await this.canvasToBlob(canvas, 'image/webp', quality)
          || await this.canvasToBlob(canvas, 'image/jpeg', quality);
        if (!blob) continue;
        fallbackBlob = blob;
        if (blob.size <= maxBytes) {
          return {
            dataUrl: await this.blobToDataUrl(blob),
            sizeKB: blob.size / 1024
          };
        }
      }
    }

    if (!fallbackBlob) {
      throw new Error('Image compression failed.');
    }

    if (fallbackBlob.size > maxBytes) {
      throw new Error(`Unable to compress the image below ${this.maxSizeKB} KB. Please choose a simpler image.`);
    }

    return {
      dataUrl: await this.blobToDataUrl(fallbackBlob),
      sizeKB: fallbackBlob.size / 1024
    };
  }

  private async exportCompressedOriginalImage(): Promise<{ dataUrl: string; sizeKB: number }> {
    const image = this.sourceImage;
    if (!image) {
      throw new Error('Original image is not available.');
    }

    const maxBytes = this.maxSizeKB * 1024;
    const scales = [1, 0.92, 0.84, 0.76, 0.68, 0.6, 0.52, 0.44, 0.36, 0.28];
    const qualities = [0.86, 0.78, 0.7, 0.62, 0.54, 0.46, 0.38, 0.3, 0.24, 0.2];
    let fallbackBlob: Blob | null = null;

    for (const scale of scales) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(80, Math.round(image.width * scale));
      canvas.height = Math.max(80, Math.round(image.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      for (const quality of qualities) {
        const blob = await this.canvasToBlob(canvas, 'image/webp', quality)
          || await this.canvasToBlob(canvas, 'image/jpeg', quality);
        if (!blob) continue;
        fallbackBlob = blob;
        if (blob.size <= maxBytes) {
          return {
            dataUrl: await this.blobToDataUrl(blob),
            sizeKB: blob.size / 1024
          };
        }
      }
    }

    if (!fallbackBlob) {
      throw new Error('Image compression failed.');
    }

    if (fallbackBlob.size > maxBytes) {
      throw new Error(`Unable to compress the image below ${this.maxSizeKB} KB. Please choose a simpler image.`);
    }

    return {
      dataUrl: await this.blobToDataUrl(fallbackBlob),
      sizeKB: fallbackBlob.size / 1024
    };
  }

  private canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), type, quality));
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Unable to read optimized image.'));
      reader.readAsDataURL(blob);
    });
  }
}
