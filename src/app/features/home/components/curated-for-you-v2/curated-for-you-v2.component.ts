import { Component } from '@angular/core';

@Component({
  selector: 'app-curated-for-you-v2',
  standalone: false,
  templateUrl: './curated-for-you-v2.component.html',
  styleUrl: './curated-for-you-v2.component.scss'
})
export class CuratedForYouV2Component {
  destinations = [
    {
      name: 'Istanbul',
      country: 'Turkey',
      dates: 'OCT 24-28',
      price: 'AED 620',
      image: '/assets/images/home/curted/istanbul.png'
    },
    {
      name: 'London',
      country: 'United Kingdom',
      dates: 'NOV 12-16',
      price: 'AED 1,248',
      image: '/assets/images/home/curted/london.png'
    },
    {
      name: 'Tokyo',
      country: 'Japan',
      dates: 'DEC 5-15',
      price: 'AED 2,350',
      image: '/assets/images/home/curted/tokyo.png'
    },
    {
      name: 'Bangkok',
      country: 'Thailand',
      dates: 'NOV 20-27',
      price: 'AED 975',
      image: '/assets/images/home/curted/bangkok.png'
    }
  ];
}
