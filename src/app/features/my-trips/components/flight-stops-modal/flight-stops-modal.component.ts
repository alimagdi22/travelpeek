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

  get activeLeg(): IFlight | null {
    if (!this.leg) return null;
    const anyLeg = this.leg as any;
    if (anyLeg.flightDTO) {
      return anyLeg as IFlight;
    }
    if (anyLeg.allJourney?.flights?.[this.selectedStopsIndex]) {
      return anyLeg.allJourney.flights[this.selectedStopsIndex];
    }
    if (anyLeg.allJourney?.flights?.[0]) {
      return anyLeg.allJourney.flights[0];
    }
    if (anyLeg.flights?.[this.selectedStopsIndex]) {
      return anyLeg.flights[this.selectedStopsIndex];
    }
    if (anyLeg.flights?.[0]) {
      return anyLeg.flights[0];
    }
    return anyLeg as IFlight;
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

