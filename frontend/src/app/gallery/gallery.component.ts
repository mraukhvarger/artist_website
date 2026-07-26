import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface Artwork {
  id: number;
  title: string;
  description: string;
  technique: string;
  dimensions: string;
  year_created: number;
  price: number;
  status: 'AVAILABLE' | 'ON_EXHIBITION' | 'PRIVATE_COLLECTION';
  exhibition_location?: string;
  collection_name?: string;
  image_url: string;
}

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      
      <!-- Заголовок галереи -->
      <div class="gallery-header">
        <h2>Коллекция работ</h2>
        <p class="subtitle">Авторские живописные произведения и эстампы</p>
      </div>

      <!-- КНОПКИ ФИЛЬТРАЦИИ -->
      <div class="filter-bar">
        <button 
          class="filter-btn" 
          [class.active]="activeFilter === 'ALL'" 
          (click)="setFilter('ALL')">
          Все работы ({{ artworks.length }})
        </button>
        <button 
          class="filter-btn" 
          [class.active]="activeFilter === 'AVAILABLE'" 
          (click)="setFilter('AVAILABLE')">
          Доступны к покупке ({{ countByStatus('AVAILABLE') }})
        </button>
        <button 
          class="filter-btn" 
          [class.active]="activeFilter === 'ON_EXHIBITION'" 
          (click)="setFilter('ON_EXHIBITION')">
          На выставке ({{ countByStatus('ON_EXHIBITION') }})
        </button>
        <button 
          class="filter-btn" 
          [class.active]="activeFilter === 'PRIVATE_COLLECTION'" 
          (click)="setFilter('PRIVATE_COLLECTION')">
          В частных коллекциях ({{ countByStatus('PRIVATE_COLLECTION') }})
        </button>
      </div>

      <!-- СЕТКА КАРТИН -->
      <div class="gallery-grid" *ngIf="filteredArtworks.length > 0; else emptyState">
        <div class="art-card" *ngFor="let art of filteredArtworks">
          
          <div class="art-image-wrapper">
            <img [src]="art.image_url || 'https://via.placeholder.com/600x400?text=Без+изображения'" [alt]="art.title">
            <span class="status-badge" [ngClass]="art.status.toLowerCase()">
              {{ getStatusText(art.status) }}
            </span>
          </div>

          <div class="art-info">
            <div class="art-meta" *ngIf="art.collection_name">
              <span class="collection">{{ art.collection_name }}</span>
            </div>
            
            <h3>{{ art.title }}</h3>
            
            <p class="specs">
              <span>{{ art.technique || 'Техника смешанная' }}</span>
              <span *ngIf="art.dimensions">• {{ art.dimensions }}</span>
              <span *ngIf="art.year_created">• {{ art.year_created }} г.</span>
            </p>

            <p class="description" *ngIf="art.description">{{ art.description }}</p>

            <!-- Локация выставки, если картина на выставке -->
            <div class="exhibition-info" *ngIf="art.status === 'ON_EXHIBITION' && art.exhibition_location">
              📍 <strong>Экспонируется:</strong> {{ art.exhibition_location }}
            </div>

            <div class="art-footer">
              <div class="price-tag">
                <span class="price" *ngIf="art.status === 'AVAILABLE'">{{ art.price | number:'1.0-0' }} ₽</span>
                <span class="sold-text" *ngIf="art.status === 'PRIVATE_COLLECTION'">В коллекции</span>
                <span class="exhibition-text" *ngIf="art.status === 'ON_EXHIBITION'">На экспозиции</span>
              </div>

              <button 
                *ngIf="art.status === 'AVAILABLE'" 
                class="btn btn-primary" 
                (click)="openBuyModal(art)">
                Приобрести
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Пустое состояние -->
      <ng-template #emptyState>
        <div class="empty-message">
          <p>В данной категории пока нет картин.</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    .gallery-header {
      text-align: center;
      margin-bottom: 30px;
    }
    .gallery-header h2 {
      font-size: 2.5rem;
      color: var(--primary);
      margin-bottom: 5px;
    }
    .subtitle {
      color: var(--text-muted);
      font-size: 1rem;
      font-style: italic;
    }

    /* Стильные кнопки фильтров */
    .filter-bar {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 40px;
    }
    .filter-btn {
      font-family: var(--font-body);
      background: transparent;
      border: 1px solid var(--border);
      padding: 10px 20px;
      border-radius: 30px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      color: var(--text-muted);
      transition: all 0.25s ease;
    }
    .filter-btn:hover {
      border-color: var(--accent);
      color: var(--primary);
    }
    .filter-btn.active {
      background-color: var(--primary);
      color: white;
      border-color: var(--primary);
      box-shadow: 0 4px 12px rgba(26, 32, 44, 0.15);
    }

    /* Карточки картин */
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 35px;
    }
    .art-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      display: flex;
      flex-direction: column;
    }
    .art-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
    }
    .art-image-wrapper {
      position: relative;
      width: 100%;
      height: 280px;
      background: #f8f9fa;
      overflow: hidden;
    }
    .art-image-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }
    .art-card:hover .art-image-wrapper img {
      transform: scale(1.04);
    }

    /* Бейджи статусов */
    .status-badge {
      position: absolute;
      top: 15px;
      right: 15px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: white;
      backdrop-filter: blur(4px);
    }
    .status-badge.available { background: rgba(16, 185, 129, 0.9); }
    .status-badge.on_exhibition { background: rgba(245, 158, 11, 0.9); }
    .status-badge.private_collection { background: rgba(100, 116, 139, 0.9); }

    /* Описание и цена */
    .art-info {
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .collection {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--accent);
      font-weight: 600;
    }
    .art-info h3 {
      font-size: 1.5rem;
      margin: 5px 0;
      color: var(--primary);
    }
    .specs {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 12px;
    }
    .description {
      font-size: 0.9rem;
      color: #4a5568;
      line-height: 1.5;
      margin-bottom: 15px;
      flex: 1;
    }
    .exhibition-info {
      background: #fffbebf;
      border: 1px solid #fef3c7;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.85rem;
      color: #b45309;
      margin-bottom: 15px;
    }

    .art-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 15px;
      border-top: 1px solid var(--border);
      margin-top: auto;
    }
    .price {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--primary);
    }
    .sold-text, .exhibition-text {
      font-size: 0.9rem;
      color: var(--text-muted);
      font-style: italic;
    }

    .empty-message {
      text-align: center;
      padding: 60px 0;
      color: var(--text-muted);
      font-size: 1.1rem;
    }
  `]
})
export class GalleryComponent implements OnInit {
  private http = inject(HttpClient);

  artworks: Artwork[] = [];
  activeFilter: 'ALL' | 'AVAILABLE' | 'ON_EXHIBITION' | 'PRIVATE_COLLECTION' = 'ALL';

  ngOnInit() {
    this.loadArtworks();
  }

  loadArtworks() {
    this.http.get<Artwork[]>('/api/artworks').subscribe(data => {
      this.artworks = data;
    });
  }

  setFilter(filter: 'ALL' | 'AVAILABLE' | 'ON_EXHIBITION' | 'PRIVATE_COLLECTION') {
    this.activeFilter = filter;
  }

  get filteredArtworks(): Artwork[] {
    if (this.activeFilter === 'ALL') {
      return this.artworks;
    }
    return this.artworks.filter(art => art.status === this.activeFilter);
  }

  countByStatus(status: 'AVAILABLE' | 'ON_EXHIBITION' | 'PRIVATE_COLLECTION'): number {
    return this.artworks.filter(art => art.status === status).length;
  }

  getStatusText(status: string): string {
    switch(status) {
      case 'AVAILABLE': return 'В наличии';
      case 'ON_EXHIBITION': return 'На выставке';
      case 'PRIVATE_COLLECTION': return 'В коллекции';
      default: return status;
    }
  }

  openBuyModal(art: Artwork) {
    alert(`Оформление заказа картины: "${art.title}" на сумму ${art.price} ₽.\n(Здесь подключается форма оплаты ЮKassa/Т-Банк)`);
  }
}