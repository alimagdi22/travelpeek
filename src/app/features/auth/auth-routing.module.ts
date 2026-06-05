import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './auth.component';
import { SocialLoginComponent } from './components/social-login/social-login.component';
import { EmailLoginComponent } from './components/email-login/email-login.component';
import { RegisterComponent } from './components/register/register.component';
import { OtpComponent } from './components/otp/otp.component';
import { otpGuard } from '../../shared/guards/otp.guard';

const routes: Routes = [
  {
    path: '',
    component: AuthComponent,
    children: [
      { path: '', component: SocialLoginComponent },
      { path: 'email', component: EmailLoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'otp', component: OtpComponent, canActivate: [otpGuard] },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
