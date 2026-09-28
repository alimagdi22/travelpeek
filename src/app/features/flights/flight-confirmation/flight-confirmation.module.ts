import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FlightConfirmationRoutingModule } from './flight-confirmation-routing.module';
import { FlightConfirmationComponent } from './flight-confirmation.component';
import { ConfirmationHeaderComponent } from './components/confirmation-header/confirmation-header.component';
import { BookingInfoComponent } from './components/booking-info/booking-info.component';
import { PassengerInfoComponent } from './components/passenger-info/passenger-info.component';
import { ConfirmationFlightDetailsComponent } from './components/confirmation-flight-details/confirmation-flight-details.component';
import { BaggageInfoComponent } from './components/baggage-info/baggage-info.component';
import { ContactInfoComponent } from './components/contact-info/contact-info.component';
import { FareDetailsComponent } from './components/fare-details/fare-details.component';
import { SharedModule } from '../../../shared/shared.module';
import { FlightPathComponent } from './components/confirmation-flight-details/flight-path/flight-path.component';
import { FlightInfoComponent } from './components/confirmation-flight-details/flight-info/flight-info.component';
import { FlightInfoDestComponent } from './components/confirmation-flight-details/flight-info/flight-info-dest/flight-info-dest.component';
import { FlightInfoStopsComponent } from './components/confirmation-flight-details/flight-info/flight-info-stops/flight-info-stops.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { PreConfirmationComponent } from './pre-confirmation/pre-confirmation.component';

@NgModule({
  declarations: [
    FlightConfirmationComponent,
    ConfirmationHeaderComponent,
    BookingInfoComponent,
    PassengerInfoComponent,
    ConfirmationFlightDetailsComponent,
    BaggageInfoComponent,
    ContactInfoComponent,
    FareDetailsComponent,
    FlightPathComponent,
    FlightInfoComponent,
    FlightInfoDestComponent,
    FlightInfoStopsComponent,
    PreConfirmationComponent,
  ],
  imports: [CommonModule, FlightConfirmationRoutingModule, SharedModule, LoaderComponent],
})
export class FlightConfirmationModule {}
