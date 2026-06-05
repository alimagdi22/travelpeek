import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('../app/features/home/home.module').then((m) => m.HomeModule),
  },
  {
    path: 'support',
    loadChildren: () =>
      import('../app/features/support/support.module').then((m) => m.SupportModule),
  },
  {
    path: 'legal',
    loadChildren: () =>
      import('./features/legal/legal.module').then((m) => m.LegalModule),
  },
  {
    path: 'my-trips',
    loadChildren: () =>
      import('./features/my-trips/my-trips.module').then((m) => m.MyTripsModule),
  },
  {
    path: 'login',
    loadChildren: () =>
      import('./features/auth/auth.module').then((m) => m.AuthModule),
  },

];
