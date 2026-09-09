import { Component, Input, Output, EventEmitter, inject, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { SharedService } from '../../shared.service';
import { FlightCheckoutApiService, FlightCheckoutService, FlightResultService, IAirItinerary } from 'rp-travel-ui';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-secure-payment',
  standalone: false,
  templateUrl: './secure-payment.component.html',
  styleUrl: './secure-payment.component.scss'
})
export class SecurePaymentComponent implements OnInit, OnChanges, OnDestroy {
  @Input() amount: number = 1240;
  @Input() currency: string = 'AED';
  @Input() itinerary: IAirItinerary | null = null;
  @Input() gateways: any[] = [];

  @Output() paymentCompleted = new EventEmitter<{ method: string; amount: number; currency: string }>();

  sharedService = inject(SharedService);
  flightCheckoutService = inject(FlightCheckoutService);
  flightCheckoutServiceApi = inject(FlightCheckoutApiService);
  flightResultService = inject(FlightResultService);

  selectedGateway: any = null;
  private paymentLinkFailureSubscription!: Subscription;

  ngOnInit() {
    this.autoSelectDefaultGateway();

    // Reset error states when payment card opens
    this.flightCheckoutService.paymentError = false;
    this.flightCheckoutService.selectedFlightError = false;

    this.paymentLinkFailureSubscription = this.flightCheckoutService.paymentLinkFailure.subscribe(() => {
      this.flightResultService.loading = false;
      this.sharedService.addMessage({
        sender: 'system',
        text: 'Booking/Payment failed. Please check your details or select a different payment method.'
      });
    });
  }

  ngOnChanges() {
    this.autoSelectDefaultGateway();
  }

  ngOnDestroy() {
    if (this.paymentLinkFailureSubscription) {
      this.paymentLinkFailureSubscription.unsubscribe();
    }
  }

  autoSelectDefaultGateway() {
    if (this.gateways && this.gateways.length > 0 && !this.selectedGateway) {
      const paytabs = this.gateways.find(g => this.getGatewayMethod(g).toLowerCase() === 'paytabscc');
      if (paytabs) {
        this.selectedGateway = paytabs;
      } else {
        this.selectedGateway = this.gateways[0];
      }
    }
  }

  getGatewayMethod(gate: any): string {
    if (!gate) return '';
    return gate.PaymentMethod || gate.paymentMethod || '';
  }

  getGatewayAmount(gate: any): number {
    if (!gate) return 0;
    return gate.Amount !== undefined ? gate.Amount : (gate.amount || 0);
  }

  getGatewayType(gate: any): string {
    if (!gate) return '';
    return gate.GatewayType || gate.gatewayType || '';
  }

  selectGatewayMethod(gate: any) {
    this.selectedGateway = gate;
  }

  get extrasAmount(): number {
    return this.flightCheckoutService.serviceFees || 0;
  }

  get selectedExtraServices() {
    const selectedCodes = new Set(this.flightCheckoutService.selectedOfflineServices || []);
    return (this.flightCheckoutService.allOfflineServices || []).filter((service) =>
      selectedCodes.has(service.serviceCode)
    );
  }

  get flightFareAmount(): number {
    const selectedAmount = this.flightCheckoutService.selectedFlight?.airItineraryDTO?.itinTotalFare?.amount;
    if (typeof selectedAmount === 'number') {
      return Math.max(selectedAmount - this.extrasAmount, 0);
    }
    return this.amount;
  }

  get displayAmount(): number {
    const markup = this.selectedGateway ? this.getGatewayAmount(this.selectedGateway) : 0;
    const selectedAmount = this.flightCheckoutService.selectedFlight?.airItineraryDTO?.itinTotalFare?.amount;
    if (typeof selectedAmount === 'number') {
      return selectedAmount + markup;
    }
    return this.amount + this.extrasAmount + markup;
  }

  get payLaterSuccess() {
    return this.flightCheckoutService.payLaterSuccess;
  }

  get saveBookingLoader() {
    return this.flightCheckoutService.saveBookingLoadeer || this.flightCheckoutService.payLaterLoader;
  }

  completePayment() {
    if (!this.selectedGateway) return;

    // Set travellersDetails on the checkout service
    this.flightCheckoutService.travellersDetails = this.sharedService.travellersDetails;

    // Initialize selectedFlight just in case it wasn't set
    if (!this.flightCheckoutService.selectedFlight) {
      (this.flightCheckoutService as any).selectedFlight = {
        searchCriteria: {} as any,
        airItineraryDTO: this.itinerary!
      };
    }

    const currency = this.currency || 'EGP';
    const recommended = this.flightCheckoutService.recommendedOfflineService;
    const hasRecommended = !!(
      recommended &&
      this.flightCheckoutService.selectedOfflineServices?.includes(recommended.serviceCode)
    );
    const type = hasRecommended ? 'premium' : 'notPremium';
    const searchIdFull = (this.flightCheckoutService.selectedFlight as any)?.searchCriteria?.searchId || '';
    const pcc = searchIdFull.split('_')[1] || this.itinerary?.pcc || '';
    const brandId = 0;
    const gatewayType = this.getGatewayType(this.selectedGateway);

    this.flightResultService.loading = true;

    if (gatewayType === 'PayLater') {
      this.flightCheckoutService.processPayLater(
        currency,
        type,
        pcc,
        brandId
      );

      const checkInterval = setInterval(() => {
        if (!this.flightCheckoutService.payLaterLoader) {
          clearInterval(checkInterval);
          this.flightResultService.loading = false;
        }
      }, 200);
    } else {
      this.flightCheckoutService.newPaymentSaveBooking(
        currency,
        type,
        pcc,
        brandId,
        this.selectedGateway,
        '' // payToken
      );

      const checkInterval = setInterval(() => {
        if (!this.flightCheckoutService.saveBookingLoadeer) {
          clearInterval(checkInterval);
          this.flightResultService.loading = false;
        }
      }, 200);
    }
  }
}
