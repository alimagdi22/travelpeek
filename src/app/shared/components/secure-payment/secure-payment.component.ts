import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-secure-payment',
  standalone: false,
  templateUrl: './secure-payment.component.html',
  styleUrl: './secure-payment.component.scss'
})
export class SecurePaymentComponent {
  @Input() amount: number = 1240;
  @Input() currency: string = 'AED';
  
  @Output() paymentCompleted = new EventEmitter<{ method: string; amount: number; currency: string }>();

  selectedMethod: 'card' | 'applepay' = 'card';

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
