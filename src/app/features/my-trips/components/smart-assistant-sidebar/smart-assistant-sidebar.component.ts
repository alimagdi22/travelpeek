import { Component, OnInit, OnDestroy, inject, Output, EventEmitter } from '@angular/core';
import { FlightCheckoutService, FlightResultService, IFlight, flightOfflineService } from 'rp-travel-ui';
import { SharedService } from '../../../../shared/shared.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-smart-assistant-sidebar',
  standalone: false,
  templateUrl: './smart-assistant-sidebar.component.html',
  styleUrl: './smart-assistant-sidebar.component.scss'
})
export class SmartAssistantSidebarComponent implements OnInit, OnDestroy {
  isSidebarCollapsed: boolean = false;
  flightResultService = inject(FlightResultService);
  flightCheckoutService = inject(FlightCheckoutService);
  sharedService = inject(SharedService);
  @Output() stopsTriggered = new EventEmitter<any>();

  showStopsModal = false;
  selectedLeg: IFlight | null = null;

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

  isMobileDrawerOpen: boolean = false;

  private subscription = new Subscription();
  private offlineResponseSub: Subscription | null = null;
  private checkoutNotifySub: Subscription | null = null;
  private selectedFlightWaitTimer: ReturnType<typeof setTimeout> | null = null;
  private recommendedPriceApplied = false;
  private lastLoadedSearchId = '';
  private originalFareAmount = 0;
  isPreparingOfflineServices = false;

  yesNoValues: Record<string, string> = {};
  hiddenServiceImages: Record<string, boolean> = {};

  ngOnInit(): void {
    this.subscription.add(
      this.sharedService.selectedItinerary$.subscribe((itinerary) => {
        if (itinerary) {
          this.isSidebarCollapsed = false;
          this.isPreparingOfflineServices = true;
          this.waitForSelectedFlightThenLoad(itinerary);
        } else {
          this.isPreparingOfflineServices = false;
          this.resetLocalOfflineState();
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.clearSelectedFlightWait();
    this.offlineResponseSub?.unsubscribe();
    this.checkoutNotifySub?.unsubscribe();
    this.subscription.unsubscribe();
  }

  get hasSelectedFlight(): boolean {
    return !!this.sharedService.getSelectedItinerary();
  }

  get offlineServices(): flightOfflineService[] {
    const organized = this.flightCheckoutService.organizedOfllineServices;
    if (organized?.length) {
      return organized;
    }
    return this.flightCheckoutService.allOfflineServices || [];
  }

  get isOfflineServicesLoading(): boolean {
    return this.isPreparingOfflineServices || this.flightCheckoutService.offlineServicesLoader;
  }

  get selectedServicesTotal(): number {
    return this.flightCheckoutService.serviceFees || 0;
  }

  get selectedServicesCount(): number {
    return new Set(this.flightCheckoutService.selectedOfflineServices || []).size;
  }

  get selectedServicesCurrency(): string {
    const first = this.flightCheckoutService.allOfflineServices?.[0];
    return first?.currency
      || this.flightCheckoutService.selectedFlight?.airItineraryDTO?.itinTotalFare?.currencyCode
      || this.sharedService.getSelectedItinerary()?.itinTotalFare?.currencyCode
      || 'EGP';
  }

  private waitForSelectedFlightThenLoad(itinerary: any): void {
    this.clearSelectedFlightWait();
    this.checkoutNotifySub?.unsubscribe();
    this.originalFareAmount = itinerary?.itinTotalFare?.amount || 0;

    if (this.doesSelectedFlightMatch(itinerary)) {
      this.captureOriginalFareFromSelectedFlight();
      this.loadOfflineServices();
      return;
    }

    this.checkoutNotifySub = this.flightCheckoutService.notify.subscribe(() => {
      if (!this.doesSelectedFlightMatch(itinerary)) {
        return;
      }
      this.clearSelectedFlightWait();
      if (!this.lastLoadedSearchId || !this.flightCheckoutService.allOfflineServices?.length) {
        this.captureOriginalFareFromSelectedFlight();
        this.loadOfflineServices();
      } else {
        this.reapplyFeesToSelectedFlight();
      }
    });

    this.selectedFlightWaitTimer = setTimeout(() => {
      if (!this.doesSelectedFlightMatch(itinerary)) {
        this.setLocalSelectedFlight(itinerary);
        this.captureOriginalFareFromSelectedFlight();
      }
      this.loadOfflineServices();
    }, 2500);
  }

  private captureOriginalFareFromSelectedFlight(): void {
    const amount = this.flightCheckoutService.selectedFlight?.airItineraryDTO?.itinTotalFare?.amount;
    if (typeof amount === 'number') {
      this.originalFareAmount = amount;
    }
  }

  private reapplyFeesToSelectedFlight(): void {
    const flight = this.flightCheckoutService.selectedFlight;
    const fees = this.flightCheckoutService.serviceFees || 0;
    if (!flight || !this.originalFareAmount) return;
    flight.airItineraryDTO.itinTotalFare.amount = this.originalFareAmount + fees;
  }

  private doesSelectedFlightMatch(itinerary: any): boolean {
    const selected = this.flightCheckoutService.selectedFlight?.airItineraryDTO;
    if (!selected || !itinerary) return false;
    return selected.sequenceNum === itinerary.sequenceNum && selected.pKey === itinerary.pKey;
  }

  private setLocalSelectedFlight(itinerary: any): void {
    const criteria = this.getSearchCriteria();
    this.flightCheckoutService.selectedFlight = {
      searchCriteria: criteria,
      airItineraryDTO: JSON.parse(JSON.stringify(itinerary)),
    } as any;
  }

  private getSearchCriteria(): any {
    return this.flightResultService.response?.searchCriteria
      || this.flightResultService.responseAi?.searchCriteria
      || this.flightCheckoutService.selectedFlight?.searchCriteria;
  }

  private loadOfflineServices(): void {
    const criteria = this.getSearchCriteria();
    const searchId = String(criteria?.searchId || '').split('_')[0];
    if (!searchId) {
      this.isPreparingOfflineServices = false;
      return;
    }
    if (searchId === this.lastLoadedSearchId) {
      this.isPreparingOfflineServices = false;
      return;
    }

    this.lastLoadedSearchId = searchId;
    this.recommendedPriceApplied = false;
    this.yesNoValues = {};
    this.hiddenServiceImages = {};
    this.flightCheckoutService.selectedOfflineServices = [];
    this.flightCheckoutService.allOfflineServices = [];
    this.flightCheckoutService.organizedOfllineServices = [];
    this.flightCheckoutService.recommendedOfflineService = undefined;
    this.flightCheckoutService.serviceFees = 0;

    this.offlineResponseSub?.unsubscribe();
    this.offlineResponseSub = this.flightCheckoutService.offlineServicesResponse.subscribe(() => {
      setTimeout(() => {
        this.applyRecommendedPriceIfNeeded();
        this.syncYesNoValues();
      });
    });

    const pos = criteria?.pos || 'EG';
    this.flightCheckoutService.getAllOfflineServices(searchId, pos, true);
    this.isPreparingOfflineServices = false;
  }

  private applyRecommendedPriceIfNeeded(): void {
    const recommended = this.flightCheckoutService.recommendedOfflineService;
    const selectedFlight = this.flightCheckoutService.selectedFlight;
    if (!recommended || !selectedFlight || this.recommendedPriceApplied) return;

    this.flightCheckoutService.serviceFees += recommended.servicePrice;
    selectedFlight.airItineraryDTO.itinTotalFare.amount += recommended.servicePrice;
    this.recommendedPriceApplied = true;
  }

  private syncYesNoValues(): void {
    (this.flightCheckoutService.allOfflineServices || []).forEach((service) => {
      if (this.normalizeServiceType(service) === 'yes/no') {
        this.yesNoValues[service.serviceCode] = service.added ? 'yes' : '';
      }
    });
  }

  private resetLocalOfflineState(): void {
    this.clearSelectedFlightWait();
    this.offlineResponseSub?.unsubscribe();
    this.checkoutNotifySub?.unsubscribe();
    this.lastLoadedSearchId = '';
    this.recommendedPriceApplied = false;
    this.originalFareAmount = 0;
    this.yesNoValues = {};
    this.hiddenServiceImages = {};
  }

  private clearSelectedFlightWait(): void {
    if (this.selectedFlightWaitTimer) {
      clearTimeout(this.selectedFlightWaitTimer);
      this.selectedFlightWaitTimer = null;
    }
  }

  normalizeServiceType(service: flightOfflineService): string {
    const type = (service.serviceType || '').toLowerCase();
    if (type === 'button') return 'addbutton';
    return type || 'addbutton';
  }

  getPackageAlt(service: flightOfflineService): flightOfflineService | null {
    return service.subServices?.[0] || null;
  }

  isServiceSelected(service: flightOfflineService): boolean {
    return !!service.added || this.flightCheckoutService.selectedOfflineServices.includes(service.serviceCode);
  }

  getServiceImage(service: flightOfflineService): string | null {
    if (this.hiddenServiceImages[service.serviceCode]) return null;
    const url = service.offlineServiceImageUrl;
    if (!url || url.toLowerCase().includes('noimage')) return null;
    return url;
  }

  onServiceImageError(service: flightOfflineService): void {
    this.hiddenServiceImages[service.serviceCode] = true;
  }

  hasHtmlDescription(text?: string | null): boolean {
    return !!text && /<\/?[a-z][\s\S]*>/i.test(text);
  }

  formatPlainDescription(text?: string | null): string {
    if (!text) return '';
    return text.replace(/\r\n/g, ' ').replace(/▪/g, '• ').replace(/\s+/g, ' ').trim();
  }

  toggleCheckboxService(service: flightOfflineService, checked: boolean): void {
    if (checked) {
      this.addService(service);
    } else {
      this.removeService(service);
    }
  }

  setYesNoService(service: flightOfflineService, value: string): void {
    this.yesNoValues[service.serviceCode] = value;
    if (value === 'yes') {
      this.addService(service);
    } else {
      this.removeService(service);
    }
    const serviceIndex = this.flightCheckoutService.allOfflineServices.findIndex(
      (item) => item.serviceCode === service.serviceCode,
    );
    if (serviceIndex !== -1) {
      this.flightCheckoutService.allOfflineServices[serviceIndex] = {
        ...this.flightCheckoutService.allOfflineServices[serviceIndex],
        interaction: true,
      };
    }
  }

  toggleAddButtonService(service: flightOfflineService): void {
    if (this.isServiceSelected(service)) {
      this.removeService(service);
    } else {
      this.addService(service);
    }
  }

  selectPackageService(serviceToAdd: flightOfflineService, serviceToRemove: flightOfflineService, parent: flightOfflineService): void {
    if (this.isServiceSelected(serviceToRemove)) {
      this.removeService(serviceToRemove);
      if (parent.serviceCode === serviceToRemove.serviceCode) {
        parent.added = false;
      } else if (parent.subServices?.[0]) {
        parent.subServices[0].added = false;
      }
    }

    if (!this.isServiceSelected(serviceToAdd)) {
      this.addService(serviceToAdd);
      if (parent.serviceCode === serviceToAdd.serviceCode) {
        parent.added = true;
      } else if (parent.subServices?.[0]) {
        parent.subServices[0].added = true;
      }
    }
  }

  private addService(service: flightOfflineService): void {
    if (this.flightCheckoutService.selectedOfflineServices.includes(service.serviceCode)) {
      return;
    }
    this.flightCheckoutService.addOfflineService(service);
  }

  private removeService(service: flightOfflineService): void {
    if (!this.flightCheckoutService.selectedOfflineServices.includes(service.serviceCode)) {
      return;
    }
    this.flightCheckoutService.removeOfflineService(service);
  }

  toggleMobileDrawer() {
    this.isMobileDrawerOpen = !this.isMobileDrawerOpen;
  }

  closeMobileDrawer() {
    this.isMobileDrawerOpen = false;
  }

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
    if (this.isMobileDrawerOpen) {
      this.closeMobileDrawer();
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
      this.flightResultService.ResultFound &&
      !this.flightResultService.loading &&
      (
        this.flightResultService.response?.airItineraries?.length ||
        this.flightResultService.responseAi?.airItineraries?.length ||
        this.flightResultService.responseAi?.itineraries?.length ||
        this.flightResultService.orgnizedResponce !== undefined
      )
    );
  }

  toggleStopControl(controlName: string) {
    if (!this.flightResultService.filterForm) return;
    const control = this.flightResultService.filterForm.get('stopsForm')?.get(controlName);
    if (control) {
      control.setValue(!control.value);
    }
    if (this.isMobileDrawerOpen) {
      this.closeMobileDrawer();
    }
  }

  getComparisonFlights(): any[] {
    if (this.flightResultService.orgnizedResponce && this.flightResultService.orgnizedResponce.length > 0) {
      return this.flightResultService.orgnizedResponce.map(group => (Array.isArray(group) ? group[0] : group)).slice(0, 5);
    }
    const res = this.flightResultService.response;
    const resAi = this.flightResultService.responseAi;
    const direct = res?.airItineraries || resAi?.airItineraries || resAi?.itineraries;
    if (direct && direct.length > 0) {
      return direct.slice(0, 5);
    }
    return [];
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  openStopsModal(flight: any) {
    if (!flight) return;
    this.stopsTriggered.emit(flight);
  }

  closeStopsModal() {
    this.showStopsModal = false;
    this.selectedLeg = null;
  }
}
