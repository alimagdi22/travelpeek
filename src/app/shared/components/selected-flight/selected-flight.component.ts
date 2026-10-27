import { Component, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { HomePageService, IAirItinerary, IFlight } from 'rp-travel-ui';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-selected-flight',
  standalone: false,
  templateUrl: './selected-flight.component.html',
  styleUrl: './selected-flight.component.scss',
})
export class SelectedFlightComponent {
  private translate = inject(TranslateService);
  private homePageService = inject(HomePageService);
  @Input() itinerary: IAirItinerary | null = null;
  @Input() passengerCountLabel: string = '';
  @Input() showSelectButton = false;
  @Output() selectClicked = new EventEmitter<IAirItinerary>();

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

  getStopsLabel(flight: IFlight): string {
    const stops = flight?.stopsNum ?? 0;
    if (stops === 0) return this.translate.instant('FLIGHTS.DIRECT');
    if (stops === 1) return this.translate.instant('FLIGHTS.ONE_STOP');
    return this.translate.instant('FLIGHTS.N_STOPS', { count: stops });
  }

  getCabinClassLabel(flight: IFlight, itinerary: IAirItinerary): string {
    let cabin =
      flight?.flightDTO?.[0]?.flightInfo?.cabinClass ||
      itinerary?.cabinClass ||
      '';
    cabin = cabin.trim();
    if (!cabin) return '';
    if (cabin.toLowerCase().includes('class')) {
      return cabin;
    }
    return cabin + ' Class';
  }

  getWeight(flight: IFlight, itinerary: IAirItinerary): string {
    const segBaggage = flight?.flightDTO?.[0]?.segmentDetails?.baggage;
    if (segBaggage) return segBaggage;
    const baggageInfo = itinerary?.baggageInformation;
    if (baggageInfo && baggageInfo.length > 0) {
      return baggageInfo[0].baggage ?? '';
    }
    return '';
  }

  getTotalPrice(itinerary: IAirItinerary): number {
    return this.convertToBaseAmount(
      itinerary?.itinTotalFare?.amount ?? 0,
      itinerary?.itinTotalFare?.currencyCode,
    );
  }

  convertToBaseAmount(price: number, sourceCurrency?: string | null): number {
    const amount = Number(price);
    if (!Number.isFinite(amount)) return 0;
    const sourceCode = String(sourceCurrency || 'EGP').trim().toUpperCase();
    if (sourceCode === 'EGP') return amount;
    const source = this.homePageService.allCurrency.find(
      (currency) => currency.Currency_Code === sourceCode,
    );
    const sourceRate = Number(source?.rate);
    if (!sourceRate) return amount;
    return amount / sourceRate;
  }

  screenWidth = window.innerWidth;

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.screenWidth = window.innerWidth;
  }
}
