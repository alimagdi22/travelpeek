import { Component, inject, OnInit, NgZone, HostListener } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { SharedModule } from './shared/shared.module';
import { EnvironmentService, AuthService, UserProfileService, LOGIN_STATUS } from 'rp-travel-ui';
import { envRP } from './core/enviroments/roundpixel.env';
import { firebaseConfig } from './core/constants/firebase-key';
import { jwtDecode } from 'jwt-decode';

declare var google: any;

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SharedModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'travelpeek';
  router: Router = inject(Router);

  private dismissKeyboard(): void {
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
    this.dismissKeyboard();
  }

  @HostListener('document:keydown.enter', ['$event'])
  onEnterPress(): void {
    this.dismissKeyboard();
  }
  environmentService = inject(EnvironmentService);
  authService = inject(AuthService);
  profileService = inject(UserProfileService);
  ngZone = inject(NgZone);
  isMyTrips = false;

  ngOnInit(): void {
    this.environmentService.envConfiguration(envRP);
    this.router.events.subscribe(() => {
    this.isMyTrips = this.router.url.includes('my-trips');
    });

    // Initialize Google One Tap if user is not logged in
    if (!localStorage.getItem('token')) {
      this.initializeGoogleOneTap();
    }
  }

  private initializeGoogleOneTap() {
    const checkGoogleLoaded = setInterval(() => {
      if (
        typeof google !== 'undefined' &&
        google.accounts &&
        google.accounts.id
      ) {
        clearInterval(checkGoogleLoaded);

        google.accounts.id.initialize({
          client_id: firebaseConfig.googleClientId,
          callback: (response: any) =>
            this.handleGoogleOneTapResponse(response),
          auto_select: false,
          cancel_on_tap_outside: true,
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
      }
    }, 100);
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
