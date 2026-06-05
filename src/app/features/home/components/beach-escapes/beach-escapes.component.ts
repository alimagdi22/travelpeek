import { Component } from '@angular/core';

interface BeachCard {
  id: number;
  title: string;
  location: string;
  rating: number;
  description: string;
  price: string;
  image: string;
  isFavorite: boolean;
}

@Component({
  selector: 'app-beach-escapes',
  standalone: false,
  templateUrl: './beach-escapes.component.html',
  styleUrl: './beach-escapes.component.scss',
})
export class BeachEscapesComponent {
  beaches: BeachCard[] = [
    {
      id: 1,
      title: 'Maafushi, Maldives',
      location: 'Maldives',
      rating: 4.9,
      description: 'Crystal clear lagoons and white sandy beaches await in this tropical paradise.',
      price: '$1,200',
      image: '/assets/images/home/beach/maldives.png',
      isFavorite: false,
    },
    {
      id: 2,
      title: 'Uluwatu, Bali',
      location: 'Indonesia',
      rating: 4.8,
      description: 'Dramatic cliffs and world-class surfing spots in the heart of Indonesia.',
      price: '$450',
      image: '/assets/images/home/beach/bali.png',
      isFavorite: false,
    },
    {
      id: 3,
      title: 'Providenciales',
      location: 'Turks and Caicos',
      rating: 5.0,
      description: "Consistently voted the world's best beach for its sheer beauty and calm turquoise waters.",
      price: '$980',
      image: '/assets/images/home/beach/1.png',
      isFavorite: false,
    },
  ];

  toggleFavorite(beach: BeachCard, event: Event) {
    event.stopPropagation();
    beach.isFavorite = !beach.isFavorite;
  }
}
