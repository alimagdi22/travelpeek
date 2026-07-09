import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { SharedService } from '../../shared.service';
import { FlightCheckoutApiService, FlightCheckoutService, IAirItinerary } from 'rp-travel-ui';

@Component({
  selector: 'app-secure-payment',
  standalone: false,
  templateUrl: './secure-payment.component.html',
  styleUrl: './secure-payment.component.scss'
})
export class SecurePaymentComponent implements OnInit {
  @Input() amount: number = 1240;
  @Input() currency: string = 'AED';
  @Input() itinerary: IAirItinerary | null = null;

  @Output() paymentCompleted = new EventEmitter<{ method: string; amount: number; currency: string }>();

  sharedService = inject(SharedService);
  flightCheckoutService = inject(FlightCheckoutService);
  flightCheckoutServiceApi = inject(FlightCheckoutApiService);

  selectedMethod: 'card' | 'applepay' = 'card';

  ngOnInit() {
    console.log(this.itinerary);

    if (this.itinerary) {
      console.log('Using itinerary from Input:', this.itinerary);
      this.flightCheckoutServiceApi.addPaymentGateways(
        this.itinerary.itinTotalFare.currencyCode,
        'EG',
        this.itinerary,
      ).subscribe({
        next: (res) => {
          console.log('Payment gateways added successfully:', res);
        },
        error: (err) => {
          console.error('Error adding payment gateways:', err);
        }
      });
    }
  }

  selectMethod(method: 'card' | 'applepay') {
    this.selectedMethod = method;
  }

  completePayment() {
    this.paymentCompleted.emit({
      method: this.selectedMethod === 'card' ? 'Visa / Mastercard' : 'Apple Pay',
      amount: this.amount,
      currency: this.currency
    });
  }
}
