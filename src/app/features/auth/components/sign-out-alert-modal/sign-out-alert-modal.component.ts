import { Component, EventEmitter, inject, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'rp-travel-ui';

@Component({
  selector: 'app-sign-out-alert-modal',
  templateUrl: './sign-out-alert-modal.component.html',
  styleUrls: ['./sign-out-alert-modal.component.scss'],
  standalone: false,
})
export class SignOutAlertModalComponent {
  @Output() clickCancel = new EventEmitter<null>();

  authService = inject(AuthService);
  router = inject(Router);

  onClickSignOut() {
    this.authService.removeToken();
    localStorage.removeItem('token');
    localStorage.removeItem('tokenHash');
    this.router.navigate(['/login']);
  }

  onClickCancel() {
    this.clickCancel.emit(null);
  }
}
