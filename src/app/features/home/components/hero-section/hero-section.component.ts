import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SharedService } from '../../../../shared/shared.service';
import { HomePageService } from 'rp-travel-ui';

@Component({
  selector: 'app-hero-section',
  standalone: false,
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.scss',
})
export class HeroSectionComponent implements OnInit, OnDestroy {
  router = inject(Router);
  sharedService = inject(SharedService);
  homePageService = inject(HomePageService);
  searchQuery: string = '';

  cards = [
    { city: 'Bangkok', country: 'Thailand', code: 'BKK', price: 'AED 890' },
    { city: 'London', country: 'United Kingdom', code: 'LHR', price: 'AED 1,240' },
    { city: 'Istanbul', country: 'Turkey', code: 'IST', price: 'AED 750' }
  ];

  activeIndex = 0;
  private intervalId: any;

  get totalCards(): number {
    if (!this.homePageService.isLoading && this.homePageService.mostSearchedFlights?.length) {
      return Math.min(this.homePageService.mostSearchedFlights.length, 3);
    }
    return this.cards.length;
  }

  ngOnInit() {
    this.startCardRotation();
    this.homePageService.getMostSearchedFlights();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  startCardRotation() {
    this.intervalId = setInterval(() => {
      const total = this.totalCards;
      if (total > 0) {
        this.activeIndex = (this.activeIndex + 1) % total;
      }
    }, 3000); // Rotate every 3 seconds
  }

  getCardClass(cardIndex: number): string {
    const total = this.totalCards;
    if (total <= 0) return 'card-bottom';
    const relativeIndex = (cardIndex - this.activeIndex + total) % total;
    if (relativeIndex === 0) return 'card-top';
    if (relativeIndex === 1) return 'card-middle';
    return 'card-bottom';
  }

  getArrivalAirport(card: any) {
    const flight = card?.cheapestAirItinerary?.allJourney?.flights?.[0];
    const dto = flight?.flightDTO;
    if (dto && dto.length > 0) {
      return dto[dto.length - 1]?.arrivalTerminalAirport?.en;
    }
    return null;
  }

  getCountryName(card: any): string {
    return this.getArrivalAirport(card)?.countryName || '';
  }

  getCityName(card: any): string {
    return this.getArrivalAirport(card)?.cityName || '';
  }

  getAirportCode(card: any): string {
    return this.getArrivalAirport(card)?.airportCode || '';
  }

  getCardCurrency(card: any): string {
    return card?.cheapestAirItinerary?.itinTotalFare?.currencyCode || '';
  }

  getCardPrice(card: any): string {
    const amount = card?.cheapestAirItinerary?.itinTotalFare?.amount;
    if (amount !== undefined && amount !== null) {
      return amount % 1 === 0 ? amount.toString() : amount.toFixed(2);
    }
    return '';
  }

  onCardClick(card: any) {
    if (!card) return;

    // Extract departure city name
    const departureAirport = card?.cheapestAirItinerary?.allJourney?.flights?.[0]?.flightDTO?.[0]?.departureTerminalAirport?.en;
    const deptCity = departureAirport?.cityName;

    // Extract arrival city name
    const arrivalAirport = this.getArrivalAirport(card);
    const arrCity = arrivalAirport?.cityName;

    // Extract arrivalDate
    const arrivalDate = card?.cheapestAirItinerary?.arrivalDate;

    if (deptCity && arrCity && arrivalDate) {
      const dateOnly = arrivalDate.split('T')[0];
      const query = `i want to travel from ${deptCity} to ${arrCity} on ${dateOnly}`;
      this.performSearch(query);
    }
  }

  performSearch(query?: string) {
    const q = query || this.searchQuery;
    if (!q || !q.trim()) return;

    this.sharedService.setSearchQuery(q.trim());
    this.router.navigate(['/my-trips']);
  }
}
