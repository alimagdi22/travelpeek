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
      titleKey: 'HOME.FEATURES.NATURAL_TITLE',
      descriptionKey: 'HOME.FEATURES.NATURAL_DESC',
      iconName: 'sparkle'
    },
    {
      titleKey: 'HOME.FEATURES.PRICE_TITLE',
      descriptionKey: 'HOME.FEATURES.PRICE_DESC',
      iconName: 'price'
    },
    {
      titleKey: 'HOME.FEATURES.BOOK_TITLE',
      descriptionKey: 'HOME.FEATURES.BOOK_DESC',
      iconName: 'timer'
    }
  ];
}
