import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const otpGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const hasAccess = sessionStorage.getItem('otpAccess') === 'true';

  if (hasAccess) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
