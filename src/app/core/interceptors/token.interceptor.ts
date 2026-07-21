import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from 'rp-travel-ui';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  authService = inject(AuthService);
  router = inject(Router);
  platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Prevent ipapi.co external IP calls on Node server during SSR (Cloudflare blocks server requests)
    if (!this.isBrowser && req.url.includes('ipapi.co')) {
      return of(new HttpResponse({
        status: 200,
        body: { country_code: 'US', country_name: 'United States', ip: '127.0.0.1' }
      }));
    }

    const isBackendUrl = req.url.startsWith('/') ||
      req.url.includes('round-pixel.net') ||
      req.url.includes('flytoall.com') ||
      req.url.includes('rhlaty.com') ||
      req.url.includes('ticketboarding.com') ||
      req.url.includes('41.223.55.14') ||
      req.url.includes('41.215.243.36') ||
      req.url.includes('178.63.214.221') ||
      req.url.includes('154.41.209.93');

    if (isBackendUrl && this.isBrowser && localStorage.getItem('token') && localStorage.getItem('tokenHash')) {
      return from(this.authService.getToken()).pipe(
        switchMap((token) => {
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
