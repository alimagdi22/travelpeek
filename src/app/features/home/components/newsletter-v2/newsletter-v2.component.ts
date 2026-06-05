import { Component } from '@angular/core';

@Component({
  selector: 'app-newsletter-v2',
  standalone: false,
  templateUrl: './newsletter-v2.component.html',
  styleUrl: './newsletter-v2.component.scss'
})
export class NewsletterV2Component {
  onSubmit(email: string) {
    if (email) {
      console.log('Subscribed email:', email);
      alert(`Thank you for subscribing with: ${email}`);
    }
  }
}
