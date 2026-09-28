import { Component, inject, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FLIGHT_DEFAULT, IFlight } from 'rp-travel-ui';

@Component({
  standalone: false,
  selector: 'app-flight-path',
  templateUrl: './flight-path.component.html',
  styleUrl: './flight-path.component.scss',
})
export class FlightPathComponent {
  @Input() flight: IFlight = FLIGHT_DEFAULT;

  translate = inject(TranslateService);

  get lang(): 'en' | 'ar' {
    return (this.translate.currentLang as 'en' | 'ar') || 'en';
  }
}
