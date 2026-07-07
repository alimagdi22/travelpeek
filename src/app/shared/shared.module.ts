import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';
import { RpTravelUiModule } from 'rp-travel-ui';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ResultCardComponent } from './components/result-card/result-card.component';
import { AvailableFlightsComponent } from './components/available-flights/available-flights.component';
import { SelectedFlightComponent } from './components/selected-flight/selected-flight.component';
import { SecurePaymentComponent } from './components/secure-payment/secure-payment.component';
import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { DatePipe } from '@angular/common';
const AngularMaterialModules = [
  MatProgressSpinnerModule,
  MatIconModule,
  MatExpansionModule,
  MatTabsModule,
  MatSliderModule,
  MatCheckboxModule,
  MatAutocompleteModule,
  MatOptionModule,
  MatInputModule,
  MatPaginatorModule,
  MatButtonModule,
  MatProgressBarModule,
  MatMenuModule,
  MatButtonModule,
  MatIconModule,
];

const SharedComponents = [
  HeaderComponent,
  FooterComponent,
  ResultCardComponent,
  AvailableFlightsComponent,
  SelectedFlightComponent,
  SecurePaymentComponent,
];
// const SharedDirectives = [];
// const SharedPipes = [];

@NgModule({
  declarations: [...SharedComponents],
  imports: [
    CommonModule,
    ...AngularMaterialModules,
    TranslateModule,
    RpTravelUiModule,
    RouterModule,
    DatePipe,
  ],
  exports: [
    ...SharedComponents,
    ...AngularMaterialModules,
    TranslateModule,
    RpTravelUiModule,
    RouterModule,
  ],
})
export class SharedModule {}
