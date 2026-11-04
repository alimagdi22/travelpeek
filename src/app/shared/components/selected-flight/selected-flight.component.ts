import { Component, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { IAirItinerary, IFlight } from 'rp-travel-ui';
import { TranslateService } from '@ngx-translate/core';
import { formatFlightDateTime, localizeBaggageWeight, localizeCabinClass } from '../../utils/flight-display.util';

@Component({
  selector: 'app-selected-flight',
  standalone: false,
  templateUrl: './selected-flight.component.html',
  styleUrl: './selected-flight.component.scss',
})
export class SelectedFlightComponent {
  private translate = inject(TranslateService);
  @Input() itinerary: IAirItinerary | null = null;
  @Input() passengerCountLabel: string = '';
  @Input() showSelectButton = false;
  @Output() selectClicked = new EventEmitter<IAirItinerary>();
  @Output() policyTriggered = new EventEmitter<IAirItinerary>();
  @Output() stopsTriggered = new EventEmitter<{ itinerary: IAirItinerary; index: number }>();

  onSelectFlight() {
    if (this.itinerary) {
      this.selectClicked.emit(this.itinerary);
    }
  }

  getOutboundFlight(itinerary: IAirItinerary): IFlight | null {
    return itinerary?.allJourney?.flights?.[0] ?? null;
  }

  getReturnFlight(itinerary: IAirItinerary): IFlight | null {
    const flights = itinerary?.allJourney?.flights;
    return flights && flights.length > 1 ? flights[1] : null;
  }

  getAirlineName(itinerary: IAirItinerary): string {
    const outbound = this.getOutboundFlight(itinerary);
    return outbound?.flightDTO?.[0]?.flightAirline?.airlineName ?? '';
  }

  getAirlineLogo(itinerary: IAirItinerary): string {
    const outbound = this.getOutboundFlight(itinerary);
    return outbound?.flightDTO?.[0]?.flightAirline?.airlineLogo || '/assets/icons/airline-default.svg';
  }


  getDeptCity(flight: IFlight): string {
    return flight?.flightDTO?.[0]?.departureTerminalAirport?.cityName ?? '';
  }

  getDeptCode(flight: IFlight): string {
    return flight?.flightDTO?.[0]?.departureTerminalAirport?.airportCode ?? '';
  }

  getArrCity(flight: IFlight): string {
    const segs = flight?.flightDTO;
    return segs && segs.length > 0
      ? (segs[segs.length - 1]?.arrivalTerminalAirport?.cityName ?? '')
      : '';
  }

  getArrCode(flight: IFlight): string {
    const segs = flight?.flightDTO;
    return segs && segs.length > 0
      ? (segs[segs.length - 1]?.arrivalTerminalAirport?.airportCode ?? '')
      : '';
  }

  getDeptDate(flight: IFlight): string {
    return flight?.flightDTO?.[0]?.departureDate ?? '';
  }

  getArrDate(flight: IFlight): string {
    const segs = flight?.flightDTO;
    return segs && segs.length > 0
      ? (segs[segs.length - 1]?.arrivalDate ?? '')
      : '';
  }

  formatFlightDate(value: string): string {
    return formatFlightDateTime(value, this.translate.currentLang);
  }

  getStopsLabel(flight: IFlight): string {
    const stops = flight?.stopsNum ?? 0;
    if (stops === 0) return this.translate.instant('FLIGHTS.DIRECT');
    if (stops === 1) return this.translate.instant('FLIGHTS.ONE_STOP');
    return this.translate.instant('FLIGHTS.N_STOPS', { count: stops });
  }

  getCabinClassLabel(flight: IFlight, itinerary: IAirItinerary): string {
    const cabin =
      flight?.flightDTO?.[0]?.flightInfo?.cabinClass ||
      itinerary?.cabinClass ||
      '';
    return localizeCabinClass(cabin, this.translate);
  }

  getWeight(flight: IFlight, itinerary: IAirItinerary): string {
    const segBaggage = flight?.flightDTO?.[0]?.segmentDetails?.baggage;
    if (segBaggage) return localizeBaggageWeight(segBaggage, this.translate);
    const baggageInfo = itinerary?.baggageInformation;
    if (baggageInfo && baggageInfo.length > 0) {
      return localizeBaggageWeight(baggageInfo[0].baggage ?? '', this.translate);
    }
    return '';
  }

  getTotalPrice(itinerary: IAirItinerary): number {
    return itinerary?.itinTotalFare?.amount ?? 0;
  }

  getCurrencyCode(itinerary: IAirItinerary): string {
    return itinerary?.itinTotalFare?.currencyCode ?? '';
  }

  screenWidth = window.innerWidth;

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.screenWidth = window.innerWidth;
  }
}
