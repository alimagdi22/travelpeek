import { Component, Input } from '@angular/core';
import { FLIGHT_DEFAULT, IFlight } from 'rp-travel-ui';

@Component({
  standalone: false,
  selector: 'app-flight-info',
  templateUrl: './flight-info.component.html',
  styleUrl: './flight-info.component.scss',
})
export class FlightInfoComponent {
  @Input() flight: IFlight = FLIGHT_DEFAULT;
}
