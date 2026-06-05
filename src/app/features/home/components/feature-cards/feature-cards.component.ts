import { Component } from '@angular/core';

@Component({
  selector: 'app-feature-cards',
  standalone: false,
  templateUrl: './feature-cards.component.html',
  styleUrl: './feature-cards.component.scss'
})
export class FeatureCardsComponent {
  features = [
    {
      title: 'Just type naturally',
      description: "No forms, no dropdowns. Say 'cheapest flight to Istanbul this weekend' and we'll handle the rest.",
      iconName: 'sparkle'
    },
    {
      title: 'Always the best price',
      description: 'We scan hundreds of airlines instantly, then show you the options that actually matter.',
      iconName: 'price'
    },
    {
      title: 'Book in seconds',
      description: "One tap to confirm. Your boarding pass arrives instantly. That's the whole experience.",
      iconName: 'timer'
    }
  ];
}
