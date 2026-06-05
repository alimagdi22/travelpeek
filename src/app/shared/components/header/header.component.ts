import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HomePageService, UserProfileService } from 'rp-travel-ui';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  homePageService = inject(HomePageService);
  router = inject(Router);
  subscription = new Subscription();
  profileService = inject(UserProfileService);
  successLogin = false;
  ngOnInit(): void {
    this.homePageService.getCurrency('EGP');
    this.subscription.add(
      this.profileService.notify.subscribe((status) => {
        status === 0 ? (this.successLogin = true) : (this.successLogin = false);
      }),
    );
  }

  navigateHome() {
    this.router.navigate(['/']);
  }

  get isSupportActive(): boolean {
    return (
      this.router.url.startsWith('/support') ||
      this.router.url.startsWith('/legal')
    );
  }

  get isMyTripsActive(): boolean {
    return this.router.url.startsWith('/my-trips');
  }

  get isExploreActive(): boolean {
    return (
      this.router.url === '/' ||
      this.router.url.startsWith('/explore') ||
      this.router.url === ''
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
