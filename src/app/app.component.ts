import { Component, inject, OnInit, NgZone } from '@angular/core';
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
          const idToken = response.credential;
          const googleUser = jwtDecode<any>(idToken);
          console.log('One Tap Login user:', googleUser);

          const sub = this.authService.notify.subscribe((status) => {
            if (status === LOGIN_STATUS.success) {
              this.profileService.getUserProfile();
              this.router.navigate(['/']);
              sub.unsubscribe();
            }
          });

          this.authService.googleLoginSubmit(googleUser);
        } catch (error) {
          console.error('Error decoding One Tap credential:', error);
        }
      });
    }
  }
}
