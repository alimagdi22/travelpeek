import { Component, inject, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-booking-info',
  templateUrl: './booking-info.component.html',
  styleUrl: './booking-info.component.scss',
})
export class BookingInfoComponent {
  @Input() bookingId = 'N/A';
  @Input() pnr = 'N/A';
  @Input() bookingDate = 'N/A';

  translate = inject(TranslateService);
}
