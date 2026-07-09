import { inject, Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from 'rp-travel-ui';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  authService = inject(AuthService);
  router = inject(Router);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const isBackendUrl = req.url.startsWith('/') ||
      req.url.includes('round-pixel.net') ||
      req.url.includes('flytoall.com') ||
      req.url.includes('rhlaty.com') ||
      req.url.includes('ticketboarding.com') ||
      req.url.includes('41.223.55.14') ||
      req.url.includes('41.215.243.36') ||
      req.url.includes('178.63.214.221') ||
      req.url.includes('154.41.209.93');
console.log(isBackendUrl , 'backend');

    if (isBackendUrl && localStorage.getItem('token') && localStorage.getItem('tokenHash')) {
      return from(this.authService.getToken()).pipe(
        switchMap((token) => {
          console.log(token,'token');
          console.log(this.authService.isTokenExpired(),'is expired');

          if (!token || this.authService.isTokenExpired()) {
            this.authService.removeToken();
            this.router.navigate(['/login']);
            return throwError(() => new Error('Unauthorized'));
          }

          const parsedToken = JSON.parse(token);
          req = req.clone({
            setHeaders: {
              Authorization: `Bearer ${parsedToken}`,
            },
          });
          return next.handle(req);
        }),
        catchError((error) => {
          if (error.status === 401) {
            console.log('error');

            // this.authService.removeToken();
            // this.router.navigate(['/login']);
          }
          return throwError(() => error);
        }),
      );
    }

    return next.handle(req);
  }
}
