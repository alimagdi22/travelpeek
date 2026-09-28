import { Component, Input } from '@angular/core';
import { IFlight } from 'rp-travel-ui';

@Component({
  standalone: false,
  selector: 'app-confirmation-flight-details',
  templateUrl: './confirmation-flight-details.component.html',
  styleUrl: './confirmation-flight-details.component.scss',
})
export class ConfirmationFlightDetailsComponent {
  @Input() flights: IFlight[] = [];
}
