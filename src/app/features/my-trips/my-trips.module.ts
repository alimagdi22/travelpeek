import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyTripsRoutingModule } from './my-trips-routing.module';
import { MyTripsComponent } from './my-trips.component';
import { HistorySidebarComponent } from './components/history-sidebar/history-sidebar.component';
import { SmartAssistantSidebarComponent } from './components/smart-assistant-sidebar/smart-assistant-sidebar.component';
import { FlightStopsModalComponent } from './components/flight-stops-modal/flight-stops-modal.component';
import { ContactFormComponent } from './components/contact-form/contact-form.component';
import { PassengerFormComponent } from './components/passenger-form/passenger-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input-gg';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

@NgModule({
  declarations: [
    MyTripsComponent,
    HistorySidebarComponent,
    SmartAssistantSidebarComponent,
    FlightStopsModalComponent,
    ContactFormComponent,
    PassengerFormComponent
  ],
  imports: [
    CommonModule,
    MyTripsRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    NgxIntlTelInputModule,
    BsDropdownModule.forRoot(),
    TooltipModule.forRoot()
  ],
})
export class MyTripsModule {}



