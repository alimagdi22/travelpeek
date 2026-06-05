import { Component } from '@angular/core';

@Component({
  selector: 'app-newsletter',
  standalone: false,
  templateUrl: './newsletter.component.html',
  styleUrl: './newsletter.component.scss',
})
export class NewsletterComponent {
  onSubmit(email: string) {
    if (email) {
      alert(`Successfully subscribed with: ${email}`);
    }
  }
}
