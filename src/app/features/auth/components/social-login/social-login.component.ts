import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
  signOut,
  User,
} from '@angular/fire/auth';
import { jwtDecode } from 'jwt-decode';
import { AuthService, LOGIN_STATUS, UserProfileService } from 'rp-travel-ui';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-social-login',
  standalone: false,
  templateUrl: './social-login.component.html',
  styleUrl: './social-login.component.scss',
})
export class SocialLoginComponent implements OnInit, OnDestroy {
  router: Router = inject(Router);
  auth: Auth = inject(Auth);
  authService = inject(AuthService);
  profileService = inject(UserProfileService);
  private notifySub?: Subscription;

  ngOnInit(): void {
    this.notifySub = this.authService.notify.subscribe((status) => {
      if (status === LOGIN_STATUS.success) {
        this.profileService.getUserProfile();
        this.router.navigate(['/']);
      } else if (status === LOGIN_STATUS.faild) {
        this.authService.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.notifySub) {
      this.notifySub.unsubscribe();
    }
  }

  async loginWithGoogle(): Promise<any | null> {
    try {
      const provider = new GoogleAuthProvider();

      provider.addScope('email');
      provider.addScope('profile');

      const result: UserCredential = await signInWithPopup(this.auth, provider);

      const credential = GoogleAuthProvider.credentialFromResult(result);

      const idToken = credential?.idToken;

      if (!idToken) {
        throw new Error('No Google ID token returned');
      }

      const googleUser = jwtDecode<any>(idToken);

      return googleUser;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async login() {
    this.authService.isLoading = true;
    try {
      const user = await this.loginWithGoogle();
      if (user) {
        this.authService.googleLoginSubmit(user);
        console.log('Google Payload:', user);
        console.log('Email:', user.email);
        console.log('Name:', user.name);
        console.log('Picture:', user.picture);
        console.log('Sub:', user.sub);
      } else {
        this.authService.isLoading = false;
      }
    } catch (error) {
      console.error(error);
      this.authService.isLoading = false;
    }
  }

  onSocialLogin(provider: string) {
    alert(`Continuing with ${provider}...`);
  }

  onEmailLogin() {
    this.router.navigate(['/login/email']);
  }

  onJoinPeek() {
    this.router.navigate(['/login/register']);
  }
}
