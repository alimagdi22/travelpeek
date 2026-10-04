import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyTripsComponent } from './my-trips.component';
import { leaveMyTripsGuard } from './guards/leave-my-trips.guard';

const routes: Routes = [
  { path: '', component: MyTripsComponent, canDeactivate: [leaveMyTripsGuard] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MyTripsRoutingModule { }
