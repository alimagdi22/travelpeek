import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './auth.component';
import { SocialLoginComponent } from './components/social-login/social-login.component';
import { EmailLoginComponent } from './components/email-login/email-login.component';
import { RegisterComponent } from './components/register/register.component';
import { OtpComponent } from './components/otp/otp.component';
import { otpGuard } from '../../shared/guards/otp.guard';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { FlightBookingComponent } from './components/flight-booking/flight-booking.component';
import { HotelsBookingComponent } from './components/hotels-booking/hotels-booking.component';
import { authGuard } from '../../shared/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: AuthComponent,
    children: [
      { path: '', component: SocialLoginComponent },
      { path: 'email', component: EmailLoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'otp', component: OtpComponent, canActivate: [otpGuard] },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'reset-password', component: ResetPasswordComponent },
    ],
  },
  {
    path: '',
    component: UserManagementComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'user-profile', pathMatch: 'full' },
      { path: 'user-profile', component: UserProfileComponent },
      { path: 'flight-booking', component: FlightBookingComponent },
      { path: 'hotels-booking', component: HotelsBookingComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
