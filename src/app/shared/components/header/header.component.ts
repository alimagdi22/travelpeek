import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  currencyModel,
  FlightResultService,
  HomePageService,
  UserProfileService,
} from 'rp-travel-ui';
import { Subscription } from 'rxjs';
import { CURRENCY_DEFAULT } from '../../../core/constants/default-currency';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  homePageService = inject(HomePageService);
  flightResult = inject(FlightResultService);
  router = inject(Router);
  subscription = new Subscription();
  profileService = inject(UserProfileService);
  successLogin = false;
  public selectedCurrency: currencyModel = CURRENCY_DEFAULT;

  ngOnInit(): void {
    const storedCurrency = sessionStorage.getItem('curr');
    this.homePageService.getCurrency(storedCurrency || 'EGP');
    this.homePageService.getPointOfSale();
    if (storedCurrency) {
      this.subscription.add(
        this.homePageService.notify.subscribe(() => {
          const currency = this.homePageService.allCurrency.find(
            (c) => c.Currency_Code === storedCurrency,
          );
          if (currency) {
            this.homePageService.selectedCurrency = currency;
          }
        }),
      );
    } else {
      this.homePageService.selectedCurrency = this.selectedCurrency;
    }
    this.subscription.add(
      this.profileService.notify.subscribe((status) => {
        status === 0 ? (this.successLogin = true) : (this.successLogin = false);
      }),
    );
    if (localStorage.getItem('token')) {
      this.profileService.getUserProfile();
    }
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

  updateCurrency(currency: currencyModel) {
    this.homePageService.selectedCurrency = currency;
    let currency_ = currency.Currency_Code.replaceAll('"', ' ');
    sessionStorage.setItem('curr', currency_);
    this.flightResult.updateCurrencyCode(currency.Currency_Code);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenHash');
    this.successLogin = false;
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
