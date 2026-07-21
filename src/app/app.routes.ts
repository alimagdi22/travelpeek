import { Routes } from '@angular/router';
import { SEO_METADATA } from './core/constants/seo-metadata.config';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./features/home/home.module').then((m) => m.HomeModule),
    data: {
      seo: SEO_METADATA['home'],
    },
  },
  {
    path: 'support',
    loadChildren: () =>
      import('./features/support/support.module').then((m) => m.SupportModule),
    data: {
      seo: SEO_METADATA['support'],
    },
  },

  {
    path: 'legal',
    loadChildren: () =>
      import('./features/legal/legal.module').then((m) => m.LegalModule),
    data: {
      seo: SEO_METADATA['legal'],
    },
  },
  {
    path: 'my-trips',
    loadChildren: () =>
      import('./features/my-trips/my-trips.module').then((m) => m.MyTripsModule),
    data: {
      seo: SEO_METADATA['myTrips'],
    },
  },
  {
    path: 'login',
    loadChildren: () =>
      import('./features/auth/auth.module').then((m) => m.AuthModule),
    data: {
      seo: SEO_METADATA['login'],
    },
  },
  {
    path: 'user-management',
    loadChildren: () =>
      import('./features/auth/auth.module').then((m) => m.AuthModule),
    data: {
      seo: SEO_METADATA['userManagement'],
    },
  },
];


