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

  segments = ['HistoryAndUpcomingFlights', 'getUser', 'editUser', 'changePassword', 'SaveBooking'];

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let isIncludesSegment = false;

    this.segments.forEach((segment) => {
      if (req.url.includes(segment)) {
        isIncludesSegment = true;
      }
    });

    if (isIncludesSegment && localStorage.getItem('token') && localStorage.getItem('tokenHash')) {
      return from(this.authService.getToken()).pipe(
        switchMap((token) => {
          if (!token || this.authService.isTokenExpired()) {
            this.authService.removeToken();
            this.router.navigate(['/login']);
            return throwError(() => new Error('Unauthorized'));
          }

          req = req.clone({
            setHeaders: { Token: JSON.parse(token) },
          });
          return next.handle(req);
        }),
        catchError((error) => {
          if (error.status === 401) {
            this.authService.removeToken();
            this.router.navigate(['/login']);
          }
          return throwError(() => error);
        }),
      );
    }

    return next.handle(req);
  }
}
