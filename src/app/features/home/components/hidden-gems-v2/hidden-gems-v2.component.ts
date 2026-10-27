import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
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

  gems = [
    {
      nameKey: 'HOME.CITIES.CAPPADOCIA',
      taglineKey: 'HOME.GEMS.CAPPADOCIA_TAGLINE',
      icon: '⭐',
      image: '/assets/images/home/hidden-gems/cappadocia.png',
    },
    {
      nameKey: 'HOME.CITIES.SANTORINI',
      taglineKey: 'HOME.GEMS.SANTORINI_TAGLINE',
      icon: '🏖️',
      image: '/assets/images/home/hidden-gems/santorini.png',
    },
    {
      nameKey: 'HOME.CITIES.KYOTO',
      taglineKey: 'HOME.GEMS.KYOTO_TAGLINE',
      icon: '🏮',
      image: '/assets/images/home/hidden-gems/kyoto.png',
    },
  ];

  navigateToMytrips(gem?: { nameKey: string }) {
    if (!gem?.nameKey) return;
    const date = new Date();
    date.setDate(date.getDate() + 7);
    const locale = this.translate.currentLang === 'ar' ? 'ar-EG' : 'en-US';
    const query = this.translate.instant('HOME.SEARCH.FROM_TO_ON', {
      from: this.translate.instant('HOME.CITIES.DUBAI'),
      to: this.translate.instant(gem.nameKey),
      date: date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }),
    });
    this.sharedService.setSearchQuery(query.trim());
    this.router.navigate(['my-trips']);
  }
}
