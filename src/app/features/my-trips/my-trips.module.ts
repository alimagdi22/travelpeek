import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyTripsRoutingModule } from './my-trips-routing.module';
import { MyTripsComponent } from './my-trips.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [MyTripsComponent],
  imports: [
    CommonModule,
    MyTripsRoutingModule,
    FormsModule
  ]
})
export class MyTripsModule { }
