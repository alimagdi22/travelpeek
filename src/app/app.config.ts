import {
  ApplicationConfig,
  provideZoneChangeDetection,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, HTTP_INTERCEPTORS, withInterceptorsFromDi } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';

import { routes } from './app.routes';
import { TokenInterceptor } from './core/interceptors/token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true,
    },
    importProvidersFrom(TranslateModule.forRoot()),
    DatePipe,
  ],
};
