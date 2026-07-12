import { Component, inject, Input, DestroyRef } from '@angular/core';
import { FlightCheckoutService, FlightResultService, IAirItinerary, IFlight } from 'rp-travel-ui';
import { SharedService } from '../../shared.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-available-flights',
  standalone: false,
  templateUrl: './available-flights.component.html',
  styleUrl: './available-flights.component.scss',
})
export class AvailableFlightsComponent {
  @Input() itineraries: IAirItinerary[] = [];
  flightResultService = inject(FlightResultService);
  flightCheckoutService = inject(FlightCheckoutService);
  sharedService = inject(SharedService);

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
    if (stops === 0) return 'Direct Flight';
    if (stops === 1) return '1 Stop';
    return `${stops} Stops`;
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
    return itinerary?.itinTotalFare?.amount ?? 0;
  }

  getCurrencyCode(itinerary: IAirItinerary): string {
    return itinerary?.itinTotalFare?.currencyCode ?? '';
  }

  selectFlight(itinerary: IAirItinerary) {
    console.log(this.flightResultService.responseAi);

    console.log(itinerary, 'itenaries');
    if (this.flightResultService.responseAi) {
      this.flightCheckoutService.getSelectedFlightData(this.flightResultService.responseAi?.searchCriteria.searchId,itinerary.sequenceNum,itinerary.pKey,true,itinerary.pcc)
    }
    this.sharedService.setSelectedItinerary(itinerary);
  }

  showPolicyModal = false;
  isLoadingPolicy = false;
  selectedItineraryForPolicy: IAirItinerary | null = null;
  cancelPenalties: any[] = [];
  changePenalties: any[] = [];
  adminCharges: any[] = [];

  private policySubscription: Subscription | null = null;
  private destroyRef = inject(DestroyRef);

  openCancelPolicy(itinerary: IAirItinerary) {
    this.selectedItineraryForPolicy = itinerary;
    this.showPolicyModal = true;
    this.isLoadingPolicy = true;
    this.cancelPenalties = [];
    this.changePenalties = [];
    this.adminCharges = [];

    const searchId = this.flightResultService.responseAi?.searchCriteria?.searchId || '';
    const sequenceNum = itinerary.sequenceNum;
    const pKey = itinerary.pKey;
    const pcc = itinerary.pcc || '';

    if (this.policySubscription) {
      this.policySubscription.unsubscribe();
    }

    this.policySubscription = this.flightResultService.brandedFareNotifier.subscribe({
      next: () => {
        this.isLoadingPolicy = false;
        this.extractFareRules();
      },
      error: (err) => {
        this.isLoadingPolicy = false;
        this.extractFareRules();
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.policySubscription) {
        this.policySubscription.unsubscribe();
      }
    });

    this.flightResultService.getBrandedFares(searchId, sequenceNum, pKey, pcc);
  }

  extractFareRules() {
    const itinerary = this.selectedItineraryForPolicy;
    if (!itinerary) return;

    // Try to get from branded fares
    const brand = this.flightResultService.currentSelectedBrands?.[0];
    const fareBreakdown = brand?.passengerFareBreakDowns?.[0] || itinerary?.passengerFareBreakDownDTOs?.[0];

    if (fareBreakdown) {
      this.cancelPenalties = fareBreakdown.cancelPenaltyDTOs || [];
      this.changePenalties = fareBreakdown.changePenaltyDTOs || [];
    }

    if (brand?.adminCharges) {
      this.adminCharges = brand.adminCharges;
    }
  }

  closePolicyModal() {
    this.showPolicyModal = false;
    if (this.policySubscription) {
      this.policySubscription.unsubscribe();
      this.policySubscription = null;
    }
  }

  getSectors(itinerary: IAirItinerary): string[] {
    const sectors: string[] = [];
    itinerary?.allJourney?.flights?.forEach((flight, index) => {
      const departureAirportCode = flight.flightDTO[0].departureTerminalAirport.airportCode;
      const arrivalAirportCode = flight.flightDTO[flight.flightDTO.length - 1].arrivalTerminalAirport.airportCode;
      sectors[index] = departureAirportCode + '-' + arrivalAirportCode;
    });
    return sectors;
  }

  showStopsModal = false;
  selectedItineraryForStops: IAirItinerary | null = null;
  selectedStopsIndex = 0;

  openStopsModal(itinerary: IAirItinerary, legIndex: number) {
    this.selectedItineraryForStops = itinerary;
    this.selectedStopsIndex = legIndex;
    this.showStopsModal = true;
  }

  closeStopsModal() {
    this.showStopsModal = false;
  }

  getActiveLeg(): IFlight | null {
    if (!this.selectedItineraryForStops) return null;
    const flights = this.selectedItineraryForStops.allJourney?.flights;
    return flights && flights.length > this.selectedStopsIndex ? flights[this.selectedStopsIndex] : null;
  }

  formatTransitTime(time: string | number): string {
    if (time === null || time === undefined) return '';

    if (typeof time === 'string' && time.includes(':')) {
      const parts = time.split(':');
      const hours = parseInt(parts[0], 10);
      const mins = parseInt(parts[1], 10);
      if (isNaN(hours) || isNaN(mins)) return '';
      if (hours === 0 && mins === 0) return '';
      if (hours === 0) return `${mins}m`;
      if (mins === 0) return `${hours}h`;
      return `${hours}h ${mins}m`;
    }

    const minutes = typeof time === 'string' ? parseInt(time, 10) : time;
    if (isNaN(minutes) || !minutes) return '';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  }
}
