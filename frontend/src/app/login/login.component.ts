import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width: 400px; margin: 50px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: #fff;">
      <h2>Вход в Админ-панель</h2>
      <form (ngSubmit)="login()">
        <div style="margin-bottom: 10px;">
          <input [(ngModel)]="username" name="username" placeholder="Логин" required style="width: 100%; padding: 8px;">
        </div>
        <div style="margin-bottom: 10px;">
          <input [(ngModel)]="password" name="password" type="password" placeholder="Пароль" required style="width: 100%; padding: 8px;">
        </div>
        <button type="submit" style="width: 100%; padding: 10px; background: #007bff; color: white; border: none; cursor: pointer;">Войти</button>
      </form>
      <p *ngIf="error" style="color: red; margin-top: 10px;">{{ error }}</p>
    </div>
  `
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';

  private http = inject(HttpClient);
  private router = inject(Router);

  login() {
    this.http.post<any>('/api/auth/login', { username: this.username, password: this.password })
      .subscribe({
        next: (res) => {
          localStorage.setItem('admin_token', res.token);
          this.router.navigate(['/admin']);
        },
        error: (err) => {
          this.error = err.error?.error || 'Ошибка входа';
        }
      });
  }
}