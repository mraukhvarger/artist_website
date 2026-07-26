import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header style="background: white; border-bottom: 1px solid #e2e8f0;">
      <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
        
        <!-- Обновленный логотип с гарантированной целостностью -->
        <a routerLink="/" class="brand-logo" style="text-decoration: none;">
          <span class="name">Мария Соловьева</span>
          <span class="sub">Художник</span>
        </a>

        <nav>
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" style="margin-left: 20px; font-weight: 500; text-decoration: none; color: #718096;">Галерея</a>
          <a routerLink="/admin" routerLinkActive="active" style="margin-left: 20px; font-weight: 500; text-decoration: none; color: #718096;">Админка</a>
        </nav>
      </div>
    </header>

    <main>
      <router-outlet></router-outlet>
    </main>
    
    <footer class="site-footer">
        <div class="footer-container">
          <div class="footer-info">
            <h4>Мария Соловьева</h4>
            <p>Персональная галерея живописи и графики.</p>
          </div>
          
          <div class="footer-copy">
            <p>&copy; {{ currentYear }} Мария Соловьева. Все права защищены.</p>
          </div>
        </div>
      </footer>
  `
})
export class AppComponent {
  currentYear: number = new Date().getFullYear();
}