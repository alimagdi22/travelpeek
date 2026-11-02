import { isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-support-topics',
  standalone: false,
  templateUrl: './support-topics.component.html',
  styleUrl: './support-topics.component.scss',
})
export class SupportTopicsComponent {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  openManageBookings(): void {
    this.openProfileOrLogin();
  }

  openPeekAiHelp(): void {
    void this.router.navigate(['/my-trips']);
  }

  openPayments(): void {
    void this.router.navigate(['/legal/terms-of-service']);
  }

  openAccountSettings(): void {
    this.openProfileOrLogin();
  }

  private openProfileOrLogin(): void {
    const isLoggedIn =
      isPlatformBrowser(this.platformId) && !!localStorage.getItem('token');
    void this.router.navigate(isLoggedIn ? ['/user-management/user-profile'] : ['/login']);
  }
}
