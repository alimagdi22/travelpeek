import { Component, Input } from '@angular/core';
import { ITIN_TOTAL_FARE_DEFAULT, ItinTotalFare } from 'rp-travel-ui';

@Component({
  standalone: false,
  selector: 'app-fare-details',
  templateUrl: './fare-details.component.html',
  styleUrl: './fare-details.component.scss',
})
export class FareDetailsComponent {
  @Input() totalFare: ItinTotalFare = ITIN_TOTAL_FARE_DEFAULT;
  @Input() adds = 0;
}
