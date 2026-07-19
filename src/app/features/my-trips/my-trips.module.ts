import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyTripsRoutingModule } from './my-trips-routing.module';
import { MyTripsComponent } from './my-trips.component';
import { HistorySidebarComponent } from './components/history-sidebar/history-sidebar.component';
import { SmartAssistantSidebarComponent } from './components/smart-assistant-sidebar/smart-assistant-sidebar.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [MyTripsComponent, HistorySidebarComponent, SmartAssistantSidebarComponent],
  imports: [CommonModule, MyTripsRoutingModule, FormsModule, ReactiveFormsModule, SharedModule],
})
export class MyTripsModule {}


