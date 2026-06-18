import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, RESET_PASSWORD_STATUS } from 'rp-travel-ui';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  standalone: false,
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  router = inject(Router);
  route = inject(ActivatedRoute);
  authService = inject(AuthService);
  subscription = new Subscription();

  isSuccessfullyReset = false;
  error = false;
  showNewPassword = false;
  showConfirmPassword = false;

  email = '';
  token = '';

  ngOnInit(): void {
    this.subscription.add(
      this.route.queryParamMap.subscribe((params) => {
        this.email = params.get('email') ?? '';
        this.token = params.get('token') ? decodeURIComponent(params.get('token')!) : '';

        this.authService.initResetPasswordForm(this.token, this.email);

        if (!this.email || !this.token) {
          this.router.navigate(['/login']);
        }
      })
    );

    this.subscription.add(
      this.authService.notify.subscribe({
        next: (status) => {
          if (status === RESET_PASSWORD_STATUS.success) {
            this.isSuccessfullyReset = true;
          } else if (status === RESET_PASSWORD_STATUS.faild) {
            this.error = true;
          }
        },
      })
    );
  }

  onReset() {
    if (this.resetPasswordForm.valid) {
      this.authService.restPassword();
    }
  }

  goToSignIn(e: Event) {
    e.stopPropagation();
    this.router.navigate(['/login']);
  }

  get isLoading() {
    return this.authService.isLoading;
  }

  get resetPasswordForm() {
    return this.authService.resetPasswordForm;
  }

  get getPasswordErrorMessage() {
    return this.authService.getPasswordErrorMessage;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.authService.isLoading = false;
  }
}
