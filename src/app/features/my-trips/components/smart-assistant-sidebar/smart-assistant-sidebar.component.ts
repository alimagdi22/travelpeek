import { Component, OnInit, inject } from '@angular/core';
import { FlightResultService } from 'rp-travel-ui';

@Component({
  selector: 'app-smart-assistant-sidebar',
  standalone: false,
  templateUrl: './smart-assistant-sidebar.component.html',
  styleUrl: './smart-assistant-sidebar.component.scss'
})
export class SmartAssistantSidebarComponent implements OnInit {
  isSidebarCollapsed: boolean = false;
  flightResultService = inject(FlightResultService);

  stopsFilter = [
    { title: 'Non-Stop', formControlName: 'noStops' },
    { title: '1 Stop', formControlName: 'oneStop' },
    { title: '2+ Stops', formControlName: 'twoAndm' },
  ];

  scheduleOptions = [
    { title: 'Morning', icon: '☀️', startTime: '00:00', endTime: '05:59' },
    { title: 'Noon', icon: '🌤️', startTime: '06:00', endTime: '11:59' },
    { title: 'Afternoon', icon: '🌅', startTime: '12:00', endTime: '17:59' },
    { title: 'Night', icon: '🌙', startTime: '18:00', endTime: '23:59' }
  ];

  // 0: Outbound Depart, 1: Outbound Arrive, 2: Return Depart, 3: Return Arrive
  activeScheduleIndex: number = 0; 
  
  ngOnInit(): void {}

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  setScheduleTab(index: number) {
    this.activeScheduleIndex = index;
  }

  toggleScheduleOption(option: any) {
    if (!this.flightResultService.filterForm) return;

    const isReturn = this.activeScheduleIndex >= 2;
    const isArrival = this.activeScheduleIndex % 2 === 1;
    
    let path = '';
    if (!isReturn) {
      path = isArrival ? 'goingFlightScheduleArrival' : 'goingFlightScheduleDepart';
    } else {
      path = isArrival ? 'returnFlightScheduleArrival' : 'returnFlightScheduleDepart';
    }
    
    const control = this.flightResultService.filterForm.get(path);
    if (control) {
      if (control.get('startTime')?.value === option.startTime && control.get('endTime')?.value === option.endTime) {
        control.get('startTime')?.setValue('');
        control.get('endTime')?.setValue('');
      } else {
        control.get('startTime')?.setValue(option.startTime);
        control.get('endTime')?.setValue(option.endTime);
      }
    }
  }

  isOptionActive(option: any): boolean {
    if (!this.flightResultService.filterForm) return false;

    const isReturn = this.activeScheduleIndex >= 2;
    const isArrival = this.activeScheduleIndex % 2 === 1;
    
    let path = '';
    if (!isReturn) {
      path = isArrival ? 'goingFlightScheduleArrival' : 'goingFlightScheduleDepart';
    } else {
      path = isArrival ? 'returnFlightScheduleArrival' : 'returnFlightScheduleDepart';
    }
    
    const control = this.flightResultService.filterForm.get(path);
    return control?.get('startTime')?.value === option.startTime && control?.get('endTime')?.value === option.endTime;
  }

  isRoundTrip(): boolean {
    return this.flightResultService.response?.searchCriteria?.flightType === 'RoundTrip';
  }

  get hasFlightResults(): boolean {
    return !!(
      this.flightResultService.response?.airItineraries?.length ||
      this.flightResultService.responseAi?.airItineraries?.length ||
      this.flightResultService.responseAi?.itineraries?.length
    );
  }

  toggleStopControl(controlName: string) {
    if (!this.flightResultService.filterForm) return;
    const control = this.flightResultService.filterForm.get('stopsForm')?.get(controlName);
    if (control) {
      control.setValue(!control.value);
    }
  }

  getComparisonFlights(): any[] {
    if (this.flightResultService.orgnizedResponce && this.flightResultService.orgnizedResponce.length > 0) {
      return this.flightResultService.orgnizedResponce.map(group => group[0]).slice(0, 5);
    }
    return [];
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
}
