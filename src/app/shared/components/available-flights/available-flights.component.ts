import { Component, inject, Input } from '@angular/core';
import { FlightCheckoutService, FlightResultService, IAirItinerary, IFlight } from 'rp-travel-ui';

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
  }
}
