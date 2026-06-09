import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { AuthService, OTP_STATUS, RESEND_OTP_STATUS, UserProfileService } from 'rp-travel-ui';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-otp',
  standalone: false,
  templateUrl: './otp.component.html',
  styleUrl: './otp.component.scss',
})
export class OtpComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  profileService = inject(UserProfileService);
  router = inject(Router);

  otpControl = new FormControl('');
  email = '';
  errorMessage = '';
  private notifySub?: Subscription;

  ngOnInit(): void {
    // Consume and clear the guard access immediately to enforce "access once"
    sessionStorage.removeItem('otpAccess');

    // Retrieve email sent during registration
    this.email = sessionStorage.getItem('otpEmail') || '';

    this.notifySub = this.authService.notify.subscribe((status) => {
      if (status === OTP_STATUS.success) {
        // Clean up sessionStorage
        sessionStorage.removeItem('otpEmail');
        this.profileService.getUserProfile();
        // Route to home on success
        this.router.navigate(['/']);
      } else if (status === OTP_STATUS.faild) {
        this.errorMessage = 'Invalid verification code. Please check and try again.';
      } else if (status === RESEND_OTP_STATUS.success) {
        this.errorMessage = '';
        alert('Verification code resent to your email.');
      } else if (status === RESEND_OTP_STATUS.faild) {
        this.errorMessage = 'Failed to resend code. Please try again.';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.notifySub) {
      this.notifySub.unsubscribe();
    }
  }

  onSubmitOtp() {
    const code = this.otpControl.value;
    if (code && code.trim()) {
      this.errorMessage = '';
      this.authService.otpSubmit(code.trim());
    }
  }

  onResendOtp() {
    this.errorMessage = '';
    if (this.email) {
      this.authService.resendOtp(this.email);
    } else {
      this.errorMessage = 'No email address found. Please register again.';
    }
  }
}
