import { Component, inject, OnInit, NgZone, HostListener, PLATFORM_ID, afterNextRender } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SharedModule } from './shared/shared.module';
import { EnvironmentService, AuthService, UserProfileService, LOGIN_STATUS } from 'rp-travel-ui';
import { envRP } from './core/enviroments/roundpixel.env';
import { firebaseConfig } from './core/constants/firebase-key';
import { jwtDecode } from 'jwt-decode';
import { SeoService } from './core/services/seo.service';

declare var google: any;

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SharedModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  host: {
    'ngSkipHydration': ''
  }
})
export class AppComponent implements OnInit {
  title = 'travelpeek';
  router: Router = inject(Router);
  platformId = inject(PLATFORM_ID);
  seoService = inject(SeoService);
  isBrowser = isPlatformBrowser(this.platformId);
  environmentService = inject(EnvironmentService);
  authService = inject(AuthService);
  profileService = inject(UserProfileService);
  ngZone = inject(NgZone);
  isMyTrips = false;

  constructor() {
    afterNextRender(() => {
      if (!localStorage.getItem('token')) {
        this.initializeGoogleOneTap();
      }
    });
  }

  private dismissKeyboard(): void {
    if (!this.isBrowser) return;
    const activeEl = document.activeElement as HTMLElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
      activeEl.blur();

      // Force keyboard dismissal on iOS/Safari by shifting focus to the body
      const body = document.body;
      const originalTabIndex = body.getAttribute('tabindex');
      body.setAttribute('tabindex', '-1');
      body.focus();
      if (originalTabIndex !== null) {
        body.setAttribute('tabindex', originalTabIndex);
      } else {
        body.removeAttribute('tabindex');
      }
    }
  }

  private isInteractiveElement(el: HTMLElement): boolean {
    if (!el) return false;
    const tagName = el.tagName;

    // Check standard interactive elements
    if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A', 'LABEL'].includes(tagName)) {
      return true;
    }

    // Check elements with interactive roles or attributes
    if (el.getAttribute('role') === 'button' || el.hasAttribute('tabindex')) {
      return true;
    }

    // Check if parent is interactive (e.g. clicked inside a button or link)
    if (el.parentElement) {
      return this.isInteractiveElement(el.parentElement);
    }

    return false;
  }

  @HostListener('document:touchstart', ['$event'])
  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent | TouchEvent): void {
    if (!this.isBrowser) return;
    const activeEl = document.activeElement as HTMLElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
      const target = event.target as HTMLElement;
      // If the target is NOT the active input itself AND is NOT an interactive element, blur
      if (target !== activeEl && !this.isInteractiveElement(target)) {
        this.dismissKeyboard();
      }
    }
  }

  @HostListener('document:touchmove', ['$event'])
  onGlobalTouchMove(): void {
    if (!this.isBrowser) return;
    this.dismissKeyboard();
  }

  @HostListener('document:keydown.enter', ['$event'])
  onEnterPress(): void {
    if (!this.isBrowser) return;
    this.dismissKeyboard();
  }

  ngOnInit(): void {
    this.seoService.initRouteSeoListener();
    this.environmentService.envConfiguration(envRP);

    this.isMyTrips = this.router.url.includes('my-trips');
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((e: NavigationEnd) => {
      console.log('hello');

      this.isMyTrips = e.urlAfterRedirects.includes('my-trips');
      console.log('hello',this.isMyTrips);
    });

    if (this.isBrowser) {
      const token = localStorage.getItem('token');
      if (!token || token === 'null' || token === 'undefined') {
        this.initializeGoogleOneTap();
      }
    }
  }

  private initializeGoogleOneTap() {
    if (typeof window === 'undefined') return;

    let prompted = false;
    const loadScriptAndPrompt = () => {
      if (prompted) return;
      if (typeof google === 'undefined' || !google?.accounts?.id) {
        return;
      }
      prompted = true;

      try {
        google.accounts.id.initialize({
          client_id: firebaseConfig.googleClientId,
          callback: (response: any) =>
            this.handleGoogleOneTapResponse(response),
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false,
        });

        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.log(
              'One Tap not displayed:',
              notification.getNotDisplayedReason(),
            );
          } else if (notification.isSkippedMoment()) {
            console.log('One Tap skipped:', notification.getSkippedReason());
          } else if (notification.isDismissedMoment()) {
            console.log(
              'One Tap dismissed:',
              notification.getDismissedReason(),
            );
          }
        });
      } catch (err) {
        console.error('Error initializing Google One Tap:', err);
      }
    };

    if (typeof google !== 'undefined' && google?.accounts?.id) {
      loadScriptAndPrompt();
    } else {
      let script = document.querySelector('script[src*="accounts.google.com/gsi/client"]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.onload = () => {
        loadScriptAndPrompt();
      };
      const checkGoogleLoaded = setInterval(() => {
        if (typeof google !== 'undefined' && google?.accounts?.id) {
          clearInterval(checkGoogleLoaded);
          loadScriptAndPrompt();
        }
      }, 200);
      setTimeout(() => clearInterval(checkGoogleLoaded), 5000);
    }
  }

  private handleGoogleOneTapResponse(response: any) {
    if (response.credential) {
      this.ngZone.run(() => {
        try {
          this.authService.isLoading = true;
          const idToken = response.credential;
          const googleUser = jwtDecode<any>(idToken);
          console.log('One Tap Login user:', googleUser);

          const sub = this.authService.notify.subscribe((status) => {
            if (status === LOGIN_STATUS.success) {
              this.profileService.getUserProfile();
              this.router.navigate(['/']);
              sub.unsubscribe();
            } else if (status === LOGIN_STATUS.faild) {
              this.authService.isLoading = false;
              sub.unsubscribe();
            }
          });

          this.authService.googleLoginSubmit(googleUser);
        } catch (error) {
          console.error('Error decoding One Tap credential:', error);
          this.authService.isLoading = false;
        }
      });
    }
  }
}
