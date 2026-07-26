import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface Artwork {
  id?: number;
  title: string;
  description: string;
  technique: string;
  dimensions: string;
  year_created: number;
  price: number;
  status: string;
  exhibition_location: string;
  collection_name: string;
  image_url: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="card form-card">
        <h2>{{ editingId ? 'Редактировать картину' : 'Добавить новую картину' }}</h2>
        
        <form (ngSubmit)="saveArtwork()">
          <div class="form-group">
            <label>Название картины *</label>
            <input class="form-control" [(ngModel)]="form.title" name="title" required placeholder="Например: Закат над Волгой">
          </div>

          <div class="grid-form">
            <div class="form-group">
              <label>Техника</label>
              <input class="form-control" [(ngModel)]="form.technique" name="technique" placeholder="Холст, масло">
            </div>

            <div class="form-group">
              <label>Размеры</label>
              <input class="form-control" [(ngModel)]="form.dimensions" name="dimensions" placeholder="60x80 см">
            </div>

            <div class="form-group">
              <label>Год создания</label>
              <input type="number" class="form-control" [(ngModel)]="form.year_created" name="year_created">
            </div>

            <div class="form-group">
              <label>Цена (₽)</label>
              <input type="number" class="form-control" [(ngModel)]="form.price" name="price" placeholder="45000">
            </div>
          </div>

          <div class="grid-form">
            <div class="form-group">
              <label>Статус картины</label>
              <select class="form-control" [(ngModel)]="form.status" name="status">
                <option value="AVAILABLE">В наличии (доступна к покупке)</option>
                <option value="ON_EXHIBITION">На выставке</option>
                <option value="PRIVATE_COLLECTION">В частной коллекции (Продано)</option>
              </select>
            </div>

            <div class="form-group" *ngIf="form.status === 'ON_EXHIBITION'">
              <label>Место проведения выставки</label>
              <input class="form-control" [(ngModel)]="form.exhibition_location" name="exhibition_location" placeholder="Галерея им. Иванова, Москва">
            </div>

            <div class="form-group">
              <label>Коллекция / Серия</label>
              <input class="form-control" [(ngModel)]="form.collection_name" name="collection_name" placeholder="Серия 'Пейзажи'">
            </div>
          </div>

          <div class="form-group">
            <label>Описание</label>
            <textarea class="form-control" rows="3" [(ngModel)]="form.description" name="description" placeholder="История или контекст создания..."></textarea>
          </div>

          <!-- ЗАГРУЗКА ИЗОБРАЖЕНИЯ -->
          <div class="form-group upload-section">
            <label>Изображение картины</label>
            <div class="upload-controls">
              <input type="file" (change)="onFileSelected($event)" accept="image/*" #fileInput style="display: none">
              <button type="button" class="btn btn-outline" (click)="fileInput.click()">
                📁 {{ uploading ? 'Загрузка...' : 'Выбрать файл с ПК' }}
              </button>
              <span class="or-text">или вставьте URL:</span>
              <input class="form-control" [(ngModel)]="form.image_url" name="image_url" placeholder="/uploads/file.jpg или https://..." style="flex: 1;">
            </div>

            <!-- ПРЕВЬЮ ЗАГРУЖЕННОЙ КАРТИНКИ -->
            <div class="image-preview" *ngIf="form.image_url">
              <img [src]="form.image_url" alt="Превью" (error)="onImgError($event)">
              <span class="preview-badge">Превью</span>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="uploading || !form.title">
              {{ editingId ? 'Сохранить изменения' : 'Добавить картину' }}
            </button>
            <button type="button" class="btn btn-outline" *ngIf="editingId" (click)="resetForm()">Отмена</button>
          </div>
        </form>
      </div>

      <!-- СПИСОК РАБОТ В БАЗЕ -->
      <div class="artworks-list-section">
        <h3>Картины в галерее ({{ artworks.length }})</h3>
        
        <div class="art-grid">
          <div class="art-card" *ngFor="let art of artworks">
            <div class="card-thumb">
              <img [src]="art.image_url || 'https://via.placeholder.com/300x200?text=No+Image'" [alt]="art.title">
              <span class="status-badge" [ngClass]="art.status.toLowerCase()">
                {{ getStatusText(art.status) }}
              </span>
            </div>
            <div class="card-body">
              <h4>{{ art.title }}</h4>
              <p class="meta">{{ art.technique || 'Техника не указана' }} • {{ art.dimensions || '-' }}</p>
              <p class="price">{{ art.price | number:'1.0-0' }} ₽</p>
              <div class="card-actions">
                <button class="btn btn-outline btn-sm" (click)="editArtwork(art)">Редактировать</button>
                <button class="btn btn-danger btn-sm" (click)="deleteArtwork(art.id!)">Удалить</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      margin-bottom: 40px;
    }
    h2, h3 { margin-bottom: 20px; color: #2c3e50; }
    .upload-section {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      border: 1px dashed #cbd5e1;
    }
    .upload-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .or-text { font-size: 0.85rem; color: #64748b; }
    .image-preview {
      margin-top: 15px;
      position: relative;
      display: inline-block;
    }
    .image-preview img {
      max-height: 150px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
    }
    .preview-badge {
      position: absolute;
      top: 5px;
      left: 5px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 2px 6px;
      font-size: 0.7rem;
      border-radius: 4px;
    }
    .form-actions { display: flex; gap: 10px; margin-top: 20px; }

    /* Сетка картин */
    .art-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
    }
    .art-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .card-thumb {
      height: 180px;
      position: relative;
      background: #f1f5f9;
    }
    .card-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .status-badge {
      position: absolute;
      bottom: 8px;
      right: 8px;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
    }
    .status-badge.available { background: #10b981; }
    .status-badge.on_exhibition { background: #f59e0b; }
    .status-badge.private_collection { background: #64748b; }

    .card-body { padding: 15px; flex: 1; display: flex; flex-direction: column; }
    .card-body h4 { margin: 0 0 5px 0; font-size: 1.1rem; }
    .meta { font-size: 0.85rem; color: #64748b; margin-bottom: 8px; }
    .price { font-size: 1.1rem; font-weight: 700; color: #2c3e50; margin-bottom: 12px; }
    .card-actions { margin-top: auto; display: flex; gap: 8px; }
    .btn-sm { padding: 5px 10px; font-size: 0.8rem; flex: 1; }
  `]
})
export class AdminComponent implements OnInit {
  private http = inject(HttpClient);

  artworks: Artwork[] = [];
  uploading = false;
  editingId: number | null = null;

  form: Artwork = this.getEmptyForm();

  ngOnInit() {
    this.loadArtworks();
  }

  getEmptyForm(): Artwork {
    return {
      title: '',
      description: '',
      technique: 'Холст, масло',
      dimensions: '',
      year_created: new Date().getFullYear(),
      price: 0,
      status: 'AVAILABLE',
      exhibition_location: '',
      collection_name: '',
      image_url: ''
    };
  }

  getAuthHeaders() {
    const token = localStorage.getItem('admin_token');
    return { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) };
  }

  loadArtworks() {
    this.http.get<Artwork[]>('/api/artworks').subscribe(data => this.artworks = data);
  }

  // Загрузка картинки на бэкенд (Multer)
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    this.uploading = true;
    const formData = new FormData();
    formData.append('image', file);

    this.http.post<any>('/api/admin/upload', formData, this.getAuthHeaders())
      .subscribe({
        next: (res) => {
          this.form.image_url = res.image_url;
          this.uploading = false;
        },
        error: (err) => {
          alert('Ошибка загрузки файла');
          this.uploading = false;
        }
      });
  }

  saveArtwork() {
    if (this.editingId) {
      this.http.put(`/api/artworks/${this.editingId}`, this.form, this.getAuthHeaders())
        .subscribe(() => {
          this.loadArtworks();
          this.resetForm();
        });
    } else {
      this.http.post('/api/artworks', this.form, this.getAuthHeaders())
        .subscribe(() => {
          this.loadArtworks();
          this.resetForm();
        });
    }
  }

  editArtwork(art: Artwork) {
    this.editingId = art.id || null;
    this.form = { ...art };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteArtwork(id: number) {
    if (!confirm('Точно удалить картину?')) return;
    this.http.delete(`/api/artworks/${id}`, this.getAuthHeaders())
      .subscribe(() => this.loadArtworks());
  }

  resetForm() {
    this.editingId = null;
    this.form = this.getEmptyForm();
  }

  getStatusText(status: string): string {
    switch(status) {
      case 'AVAILABLE': return 'В наличии';
      case 'ON_EXHIBITION': return 'На выставке';
      case 'PRIVATE_COLLECTION': return 'В коллекции';
      default: return status;
    }
  }

  onImgError(event: any) {
    event.target.style.display = 'none';
  }
}