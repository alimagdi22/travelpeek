import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from '../../../../shared/shared.service';

@Component({
  selector: 'app-curated-for-you-v2',
  standalone: false,
  templateUrl: './curated-for-you-v2.component.html',
  styleUrl: './curated-for-you-v2.component.scss',
})
export class CuratedForYouV2Component {
  router = inject(Router);
  sharedService = inject(SharedService);
  private translate = inject(TranslateService);
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

  destinations = [
    {
      nameKey: 'HOME.CITIES.ISTANBUL',
      countryKey: 'HOME.COUNTRIES.TURKEY',
      datesKey: 'HOME.CURATED.ISTANBUL_DATES',
      price: 'AED 620',
      image: '/assets/images/home/curted/istanbul.png',
    },
    {
      nameKey: 'HOME.CITIES.LONDON',
      countryKey: 'HOME.COUNTRIES.UNITED_KINGDOM',
      datesKey: 'HOME.CURATED.LONDON_DATES',
      price: 'AED 1,248',
      image: '/assets/images/home/curted/london.png',
    },
    {
      nameKey: 'HOME.CITIES.TOKYO',
      countryKey: 'HOME.COUNTRIES.JAPAN',
      datesKey: 'HOME.CURATED.TOKYO_DATES',
      price: 'AED 2,350',
      image: '/assets/images/home/curted/tokyo.png',
    },
    {
      nameKey: 'HOME.CITIES.BANGKOK',
      countryKey: 'HOME.COUNTRIES.THAILAND',
      datesKey: 'HOME.CURATED.BANGKOK_DATES',
      price: 'AED 975',
      image: '/assets/images/home/curted/bangkok.png',
    },
  ];
  navigateToMytrips(dest?: { nameKey: string; datesKey: string }) {
    if (!dest?.nameKey) return;
    const query = this.translate.instant('HOME.SEARCH.FROM_TO_ON', {
      from: this.translate.instant('HOME.CITIES.DUBAI'),
      to: this.translate.instant(dest.nameKey),
      date: this.translate.instant(dest.datesKey),
    });
    this.sharedService.setSearchQuery(query.trim());
    this.router.navigate(['my-trips']);
  }
}
