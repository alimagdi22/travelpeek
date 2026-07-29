import { Component, HostBinding, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  private router = inject(Router);

  @HostBinding('style.display')
  get hostDisplay(): string {
    return this.router.url.includes('my-trips') ? 'none' : 'block';
  }
}
