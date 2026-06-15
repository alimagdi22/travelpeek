import { Component, Input } from '@angular/core';
import { IAirItinerary, IFlight } from 'rp-travel-ui';

@Component({
  selector: 'app-result-card',
  standalone: false,
  templateUrl: './result-card.component.html',
  styleUrl: './result-card.component.scss',
})
export class ResultCardComponent {
  @Input() itinerary!: IAirItinerary;

  get outboundFlight(): IFlight | null {
    return this.itinerary?.allJourney?.flights?.[0] ?? null;
  }

  get returnFlight(): IFlight | null {
    const flights = this.itinerary?.allJourney?.flights;
    return flights && flights.length > 1 ? flights[1] : null;
  }

  get airlineCode(): string {
    return this.outboundFlight?.flightAirline?.airlineCode ?? '';
  }

  get cabinClass(): string {
    return this.itinerary?.cabinClass ?? '';
  }

  get totalPrice(): number {
    return this.itinerary?.itinTotalFare?.amount ?? 0;
  }

  get currencyCode(): string {
    return this.itinerary?.itinTotalFare?.currencyCode ?? '';
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`;
  }

  getDeptCode(flight: IFlight): string {
    return flight?.flightSegments?.[0]?.departureTerminalAirport?.airportCode ?? '';
  }

  getArrCode(flight: IFlight): string {
    const segs = flight?.flightSegments;
    return segs?.[segs.length - 1]?.arrivalTerminalAirport?.airportCode ?? '';
  }

  getDeptDate(flight: IFlight): string {
    return flight?.flightSegments?.[0]?.departureDate ?? '';
  }

  getArrDate(flight: IFlight): string {
    const segs = flight?.flightSegments;
    return segs?.[segs.length - 1]?.arrivalDate ?? '';
  }

  getStopsLabel(flight: IFlight): string {
    const stops = flight?.stopsNum ?? 0;
    if (stops === 0) return 'Non-stop';
    if (stops === 1) return '1 Stop';
    return `${stops} Stops`;
  }
}
