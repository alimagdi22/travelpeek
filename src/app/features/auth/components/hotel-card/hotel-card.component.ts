import { Component, Input } from '@angular/core';
import { ICardModel } from 'rp-travel-ui';

@Component({
  selector: 'app-hotel-card',
  templateUrl: './hotel-card.component.html',
  styleUrls: ['./hotel-card.component.scss'],
  standalone: false,
})
export class HotelCardComponent {
  @Input() trip: ICardModel = {
    airline: '',
    bookingRef: '',
    dates: '',
    flightType: '',
    itineraryNumber: '',
    route: '',
    ticketNumber: [],
    cityImage: '',
  };
}
