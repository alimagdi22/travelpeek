import { Component } from '@angular/core';

@Component({
  selector: 'app-support-faq',
  standalone: false,
  templateUrl: './support-faq.component.html',
  styleUrl: './support-faq.component.scss',
})
export class SupportFaqComponent {
  activeIndex: number | null = null;

  toggleFaq(index: number) {
    if (this.activeIndex === index) {
      this.activeIndex = null;
    } else {
      this.activeIndex = index;
    }
  }
}
