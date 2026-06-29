import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyTripsRoutingModule } from './my-trips-routing.module';
import { MyTripsComponent } from './my-trips.component';
import { HistorySidebarComponent } from './components/history-sidebar/history-sidebar.component';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [MyTripsComponent, HistorySidebarComponent],
  imports: [CommonModule, MyTripsRoutingModule, FormsModule, SharedModule],
})
export class MyTripsModule {}
