import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SharedService } from '../../../../shared/shared.service';

@Component({
  selector: 'app-hidden-gems-v2',
  standalone: false,
  templateUrl: './hidden-gems-v2.component.html',
  styleUrl: './hidden-gems-v2.component.scss',
})
export class HiddenGemsV2Component {
  router = inject(Router);
  sharedService = inject(SharedService);
  searchQuery: string = '';
  scrollSlider(element: HTMLElement, direction: string) {
    const card = element.querySelector('.slider-item');
    if (!card) return;
    const cardWidth = card.getBoundingClientRect().width;
    const scrollAmount = cardWidth + 16; // width + gap
    element.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }

  gems = [
    {
      name: 'Cappadocia',
      tagline: 'High rating choice',
      icon: '⭐',
      image: '/assets/images/home/hidden-gems/cappadocia.png',
    },
    {
      name: 'Santorini',
      tagline: 'Cliff side views',
      icon: '🏖️',
      image: '/assets/images/home/hidden-gems/santorini.png',
    },
    {
      name: 'Kyoto',
      tagline: 'Historic district',
      icon: '🏮',
      image: '/assets/images/home/hidden-gems/kyoto.png',
    },
  ];

  navigateToMytrips(query?: any) {
    let q = query || this.searchQuery;
    if (!q) return;
    const date = new Date();
    date.setDate(date.getDate() + 7);

    const result = date.toDateString().slice(0, 10);
    q = `i want to travel from Dubai to ${q.name} on ${result}`;
    this.sharedService.setSearchQuery(q.trim());
    this.router.navigate(['my-trips']);
  }
}
