import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-social-login',
  standalone: false,
  templateUrl: './social-login.component.html',
  styleUrl: './social-login.component.scss',
})
export class SocialLoginComponent {
  constructor(private router: Router) {}

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
