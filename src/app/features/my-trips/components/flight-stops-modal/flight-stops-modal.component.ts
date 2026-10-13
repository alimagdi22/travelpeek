import { Component, Input, Output, EventEmitter, ElementRef, inject, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { FlightCheckoutService, FlightResultService, IFlight } from 'rp-travel-ui';
import { SharedService } from '../../../../shared/shared.service';

@Component({
  selector: 'app-flight-stops-modal',
  standalone: false,
  templateUrl: './flight-stops-modal.component.html',
  styleUrl: './flight-stops-modal.component.scss'
})
export class FlightStopsModalComponent implements OnChanges, OnDestroy {
  @Input() isOpen: boolean = false;
  @Input() leg: any = null;
  @Input() selectedStopsIndex: number = 0;
  @Output() closeModal = new EventEmitter<void>();
  @Output() flightSelected = new EventEmitter<any>();

  private el = inject(ElementRef);
  private flightResultService = inject(FlightResultService);
  private flightCheckoutService = inject(FlightCheckoutService);
  private sharedService = inject(SharedService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        if (this.el.nativeElement.parentNode !== document.body) {
          document.body.appendChild(this.el.nativeElement);
        }
      } else {
        if (this.el.nativeElement.parentNode === document.body) {
          document.body.removeChild(this.el.nativeElement);
        }
      }
    }
  }

  ngOnDestroy(): void {
    if (this.el.nativeElement.parentNode === document.body) {
      document.body.removeChild(this.el.nativeElement);
    }
  }

  get journeyFlights(): IFlight[] {
    const anyLeg = this.leg as any;
    if (!anyLeg) return [];
    if (Array.isArray(anyLeg.allJourney?.flights) && anyLeg.allJourney.flights.length) {
      return anyLeg.allJourney.flights;
    }
    if (Array.isArray(anyLeg.flights) && anyLeg.flights.length) {
      return anyLeg.flights;
    }
    if (anyLeg.flightDTO) {
      return [anyLeg as IFlight];
    }
    return [];
  }

  get displayLegs(): { flight: IFlight; label: string; index: number }[] {
    const flights = this.journeyFlights;
    if (!flights.length) return [];
    if (this.selectedStopsIndex < 0) {
      return flights.map((flight, index) => ({
        flight,
        label: this.legLabel(index),
        index,
      }));
    }
    const flight = this.activeLeg;
    return flight ? [{ flight, label: this.legLabel(this.selectedStopsIndex), index: this.selectedStopsIndex }] : [];
  }

  get activeLeg(): IFlight | null {
    const flights = this.journeyFlights;
    if (!flights.length) return null;
    if (this.selectedStopsIndex >= 0 && flights[this.selectedStopsIndex]) {
      return flights[this.selectedStopsIndex];
    }
    return flights[0];
  }

  private legLabel(index: number): string {
    if (index === 0) return 'Outbound Flight';
    if (index === 1) return 'Return Flight';
    return `Flight ${index + 1}`;
  }

  onClose() {
    this.closeModal.emit();
  }

  get priceAmount(): number | null {
    const anyLeg = this.leg as any;
    return anyLeg?.itinTotalFare?.amount ?? null;
  }

  get currencyCode(): string {
    const anyLeg = this.leg as any;
    return anyLeg?.itinTotalFare?.currencyCode ?? 'EGP';
  }

  onSelectFlight() {
    if (!this.leg) return;
    const itinerary = this.leg as any;
    const response = this.flightResultService.response;
    if (response) {
      this.flightCheckoutService.getSelectedFlightData(
        response.searchCriteria.searchId,
        itinerary.sequenceNum,
        itinerary.pKey,
        true,
        itinerary.pcc
      );
    }
    this.sharedService.setSelectedItinerary(itinerary);
  }


  getDeptCity(flight: IFlight | null): string {
    return flight?.flightDTO?.[0]?.departureTerminalAirport?.cityName ?? '';
  }

  getDeptCode(flight: IFlight | null): string {
    return flight?.flightDTO?.[0]?.departureTerminalAirport?.airportCode ?? '';
  }

  getArrCity(flight: IFlight | null): string {
    const segs = flight?.flightDTO;
    return segs && segs.length > 0 ? (segs[segs.length - 1]?.arrivalTerminalAirport?.cityName ?? '') : '';
  }

  getArrCode(flight: IFlight | null): string {
    const segs = flight?.flightDTO;
    return segs && segs.length > 0 ? (segs[segs.length - 1]?.arrivalTerminalAirport?.airportCode ?? '') : '';
  }

  formatTransitTime(time: string | number | undefined | null): string {
    if (time === null || time === undefined) return '';
    if (typeof time === 'number') {
      const hours = Math.floor(time / 60);
      const mins = time % 60;
      return `${hours}h ${mins}m`;
    }
    return time.toString();
  }
}

