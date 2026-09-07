import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SharedService } from '../../../../shared/shared.service';

@Component({
  selector: 'app-beach-escapes-v2',
  standalone: false,
  templateUrl: './beach-escapes-v2.component.html',
  styleUrl: './beach-escapes-v2.component.scss',
})
export class BeachEscapesV2Component {
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

  escapes = [
    {
      name: 'Maldives',
      description: 'Crystal clear waters and private villas.',
      price: 'AED 3,450',
      image: '/assets/images/home/beach-escapes/maldives.png',
    },
    {
      name: 'Seychelles',
      description: 'Untouched nature and white sands.',
      price: 'AED 2,090',
      image: '/assets/images/home/beach-escapes/Seychelles.png',
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
