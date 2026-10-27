import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
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

  escapes = [
    {
      nameKey: 'HOME.CITIES.MALDIVES',
      descriptionKey: 'HOME.BEACH.MALDIVES_DESC',
      price: 'AED 3,450',
      image: '/assets/images/home/beach-escapes/maldives.png',
    },
    {
      nameKey: 'HOME.CITIES.SEYCHELLES',
      descriptionKey: 'HOME.BEACH.SEYCHELLES_DESC',
      price: 'AED 2,090',
      image: '/assets/images/home/beach-escapes/Seychelles.png',
    },
  ];

  navigateToMytrips(escape?: { nameKey: string }) {
    if (!escape?.nameKey) return;
    const date = new Date();
    date.setDate(date.getDate() + 7);
    const locale = this.translate.currentLang === 'ar' ? 'ar-EG' : 'en-US';
    const query = this.translate.instant('HOME.SEARCH.FROM_TO_ON', {
      from: this.translate.instant('HOME.CITIES.DUBAI'),
      to: this.translate.instant(escape.nameKey),
      date: date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }),
    });
    this.sharedService.setSearchQuery(query.trim());
    this.router.navigate(['my-trips']);
  }
}
