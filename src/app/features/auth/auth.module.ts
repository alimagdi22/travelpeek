import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SharedModule } from '../../shared/shared.module';

import { AuthRoutingModule } from './auth-routing.module';
import { AuthComponent } from './auth.component';
import { SocialLoginComponent } from './components/social-login/social-login.component';
import { EmailLoginComponent } from './components/email-login/email-login.component';
import { RegisterComponent } from './components/register/register.component';
import { OtpComponent } from './components/otp/otp.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';

import { UserManagementComponent } from './components/user-management/user-management.component';
import { SideNavContentComponent } from './components/side-nav-content/side-nav-content.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { FlightBookingComponent } from './components/flight-booking/flight-booking.component';
import { HotelsBookingComponent } from './components/hotels-booking/hotels-booking.component';
import { FlightCardComponent } from './components/flight-card/flight-card.component';
import { HotelCardComponent } from './components/hotel-card/hotel-card.component';
import { TicketsComponent } from './components/flight-card/tickets/tickets.component';
import { SignOutAlertModalComponent } from './components/sign-out-alert-modal/sign-out-alert-modal.component';

@NgModule({
  declarations: [
    AuthComponent,
    SocialLoginComponent,
    EmailLoginComponent,
    RegisterComponent,
    OtpComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    UserManagementComponent,
    SideNavContentComponent,
    UserProfileComponent,
    FlightBookingComponent,
    HotelsBookingComponent,
    FlightCardComponent,
    HotelCardComponent,
    TicketsComponent,
    SignOutAlertModalComponent,
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    SharedModule,
  ],
})
export class AuthModule {}
