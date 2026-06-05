import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AuthRoutingModule } from './auth-routing.module';
import { AuthComponent } from './auth.component';
import { SocialLoginComponent } from './components/social-login/social-login.component';
import { EmailLoginComponent } from './components/email-login/email-login.component';
import { RegisterComponent } from './components/register/register.component';
import { OtpComponent } from './components/otp/otp.component';

@NgModule({
  declarations: [
    AuthComponent,
    SocialLoginComponent,
    EmailLoginComponent,
    RegisterComponent,
    OtpComponent,
  ],
  imports: [CommonModule, AuthRoutingModule, FormsModule, ReactiveFormsModule],
})
export class AuthModule {}
