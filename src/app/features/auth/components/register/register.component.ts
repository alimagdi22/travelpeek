import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { AuthService, REGISTER_STATUS } from 'rp-travel-ui';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  router = inject(Router);

  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';
  private notifySub?: Subscription;

  ngOnInit(): void {
    this.authService.initRegisterForm();
    this.notifySub = this.authService.notify.subscribe((status) => {
      if (status === REGISTER_STATUS.success) {
        // Grant OTP page access and navigate
        sessionStorage.setItem('otpAccess', 'true');
        // Store registered email to show it on OTP screen
        const email = this.authService.registerForm.get('email')?.value || '';
        sessionStorage.setItem('otpEmail', email);

        this.router.navigate(['/login/otp']);
      } else if (status === REGISTER_STATUS.faild) {
        this.errorMessage = 'Registration failed. The email or username might already be in use.';
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

  onLogin() {
    this.router.navigate(['/login/email']);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmitRegister() {
    this.errorMessage = '';
    this.authService.regitserSubmit();
  }

  getFirstNameError(): string {
    const control = this.authService.registerForm.get('firstName');
    return control ? this.authService.getFirstNameErrorMessage(control) : '';
  }

  getLastNameError(): string {
    const control = this.authService.registerForm.get('lastName');
    return control ? this.authService.getLastNameErrorMessage(control) : '';
  }

  getUsernameError(): string {
    const control = this.authService.registerForm.get('username');
    return control ? this.authService.getUserNameErrorMessage(control) : '';
  }

  getPhoneError(): string {
    const control = this.authService.registerForm.get('userPhoneNumber');
    return control ? this.authService.getPhoneErrorMessage(control) : '';
  }

  getEmailRegisterError(): string {
    const control = this.authService.registerForm.get('email');
    return control ? this.authService.getEmailErrorMessage(control) : '';
  }

  getPasswordRegisterError(): string {
    const control = this.authService.registerForm.get('password');
    return control ? this.authService.getPasswordErrorMessage(control, 'en', true) : '';
  }

  getConfirmPasswordError(): string {
    const group = this.authService.registerForm;
    if (group.hasError('mismatch') && group.get('confirmPassword')?.touched) {
      return 'Passwords do not match.';
    }
    const control = group.get('confirmPassword');
    if (control?.touched && control.hasError('required')) {
      return 'Please confirm your password.';
    }
    return '';
  }
}
