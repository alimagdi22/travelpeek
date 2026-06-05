import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { AuthService, LOGIN_STATUS, UserProfileService } from 'rp-travel-ui';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-email-login',
  standalone: false,
  templateUrl: './email-login.component.html',
  styleUrl: './email-login.component.scss',
})
export class EmailLoginComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  profileService = inject(UserProfileService);
  router = inject(Router);

  showPassword = false;
  errorMessage = '';
  private notifySub?: Subscription;

  ngOnInit(): void {
    this.authService.initLoginForm();
    this.notifySub = this.authService.notify.subscribe((status) => {
      if (status === LOGIN_STATUS.success) {
        this.profileService.getUserProfile();
        this.router.navigate(['/']);
      } else if (status === LOGIN_STATUS.faild) {
        this.errorMessage = 'Invalid email or password. Please try again.';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.notifySub) {
      this.notifySub.unsubscribe();
    }
  }

  goBackToOptions() {
    this.router.navigate(['/login']);
  }

  onJoinPeek() {
    this.router.navigate(['/login/register']);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmitForm() {
    this.errorMessage = '';
    this.authService.loginSubmit();
  }

  getEmailError(): string {
    const control = this.authService.loginForm.get('email');
    return control ? this.authService.getEmailErrorMessage(control) : '';
  }

  getPasswordError(): string {
    const control = this.authService.loginForm.get('password');
    return control ? this.authService.getPasswordErrorMessage(control) : '';
  }
}
