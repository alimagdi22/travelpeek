import { Component, Input } from '@angular/core';
import { ICardModel } from 'rp-travel-ui';

@Component({
  selector: 'app-flight-card',
  templateUrl: './flight-card.component.html',
  styleUrls: ['./flight-card.component.scss'],
  standalone: false,
})
export class FlightCardComponent {
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

  trigger = false;

  onImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/icons/userPage/otp-background.jpg';
  }

  get flightType() {
    let type = '';

    if (this.trip.flightType) {
      switch (this.trip.flightType.toLowerCase()) {
        case 'oneway':
          type = 'One Way';
          break;
        case 'return':
          type = 'Round Trip';
          break;
        case 'multitrip':
          type = 'Multi Trip';
          break;
      }
    }

    return type;
  }
}
