import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, FORGET_PASSWORD_STATUS } from 'rp-travel-ui';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  standalone: false,
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  router = inject(Router);
  authService = inject(AuthService);
  subscription = new Subscription();

  isSuccessfullySent = false;
  error = false;

  ngOnInit(): void {
    this.authService.initForgetPasswordForm();

    this.subscription.add(
      this.authService.notify.subscribe({
        next: (status) => {
          if (status === FORGET_PASSWORD_STATUS.success) {
            this.isSuccessfullySent = true;
          } else if (status === FORGET_PASSWORD_STATUS.faild) {
            this.error = true;
          }
        },
      })
    );
  }

  onSubmit() {
    if (this.forgetPasswordForm.valid) {
      this.authService.forgetPassword();
    }
  }

  goToSignIn(e: Event) {
    e.stopPropagation();
    this.router.navigate(['/login']);
  }

  resendEmail(e: Event) {
    e.stopPropagation();
    if (this.forgetPasswordForm.valid) {
      this.authService.forgetPassword();
    }
  }

  get isLoading() {
    return this.authService.isLoading;
  }

  get forgetPasswordForm() {
    return this.authService.forgetPasswordForm;
  }

  get getEmailErrorMessage() {
    return this.authService.getEmailErrorMessage;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.authService.isLoading = false;
  }
}
