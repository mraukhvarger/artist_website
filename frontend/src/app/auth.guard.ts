import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('admin_token');
  
  if (token) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};