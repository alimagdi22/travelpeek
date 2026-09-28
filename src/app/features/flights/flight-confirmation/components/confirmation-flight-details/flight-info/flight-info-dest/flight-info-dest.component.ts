import { Component, inject, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FLIGHT_DTO_DEFAULT, IFlightDTO } from 'rp-travel-ui';

@Component({
  standalone: false,
  selector: 'app-flight-info-dest',
  templateUrl: './flight-info-dest.component.html',
  styleUrl: './flight-info-dest.component.scss',
})
export class FlightInfoDestComponent {
  @Input({ required: true }) isDepart = true;
  @Input() flightDTO: IFlightDTO = FLIGHT_DTO_DEFAULT;

  translate = inject(TranslateService);
}
