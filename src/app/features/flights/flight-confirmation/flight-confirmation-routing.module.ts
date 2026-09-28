import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FlightConfirmationComponent } from './flight-confirmation.component';
import { PreConfirmationComponent } from './pre-confirmation/pre-confirmation.component';

const routes: Routes = [
  { path: '', component: PreConfirmationComponent },
  { path: 'flightConfirmation', component: FlightConfirmationComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FlightConfirmationRoutingModule {}
