import { Component, OnInit, OnDestroy, inject, Output, EventEmitter } from '@angular/core';
import { FlightCheckoutService, FlightResultService, HomePageService, IFlight, flightOfflineService } from 'rp-travel-ui';
import { SharedService } from '../../../../shared/shared.service';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

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
  homePageService = inject(HomePageService);
  translate = inject(TranslateService);
  @Output() stopsTriggered = new EventEmitter<any>();

  showStopsModal = false;
  selectedLeg: IFlight | null = null;

  stopsFilter = [
    { titleKey: 'ASSISTANT.NON_STOP', formControlName: 'noStops' },
    { titleKey: 'ASSISTANT.ONE_STOP', formControlName: 'oneStop' },
    { titleKey: 'ASSISTANT.TWO_PLUS', formControlName: 'twoAndm' },
  ];

  scheduleOptions = [
    { titleKey: 'ASSISTANT.MORNING', icon: '☀️', startTime: '00:00', endTime: '05:59' },
    { titleKey: 'ASSISTANT.NOON', icon: '🌤️', startTime: '06:00', endTime: '11:59' },
    { titleKey: 'ASSISTANT.AFTERNOON', icon: '🌅', startTime: '12:00', endTime: '17:59' },
    { titleKey: 'ASSISTANT.NIGHT', icon: '🌙', startTime: '18:00', endTime: '23:59' }
  ];

  // 0: Outbound Depart, 1: Outbound Arrive, 2: Return Depart, 3: Return Arrive
  activeScheduleIndex: number = 0;

  isMobileDrawerOpen: boolean = false;

  private subscription = new Subscription();
  private offlineResponseSub: Subscription | null = null;
  private checkoutNotifySub: Subscription | null = null;
  private selectedFlightWaitTimer: ReturnType<typeof setTimeout> | null = null;
  private lastLoadedSearchId = '';
  private originalFareAmount = 0;
  isPreparingOfflineServices = false;

  yesNoValues: Record<string, string> = {};
  hiddenServiceImages: Record<string, boolean> = {};

  ngOnInit(): void {
    console.log(this.recommendedFlight,'this.recommendedFlight');

    this.subscription.add(
      this.sharedService.selectedItinerary$.subscribe((itinerary) => {
        if (itinerary) {
          console.log(itinerary,'itinerary');

          this.isSidebarCollapsed = false;
          this.isPreparingOfflineServices = true;
          this.waitForSelectedFlightThenLoad(itinerary);
        } else {
          this.isPreparingOfflineServices = false;
          this.resetLocalOfflineState();
        }
      }),
    );

    this.sharedService.message$.subscribe((msg) => {
      console.log(msg,'msg');
    })
    this.subscription.add(
      this.flightResultService.notify.subscribe(() => {
        this.persistAssistantSnapshot();
        console.log(this.flightResultService.responseAi?.searchCriteria,'this.flightResultService.responseAi?.searchCriteria');
        console.log(this.flightResultService.response,'this.flightResultService.response');
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
    return this.sharedService.getSavedFlightSearchResponseAi()?.searchCriteria
      || this.flightResultService.responseAi?.searchCriteria
      || this.flightResultService.response?.searchCriteria
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
    this.yesNoValues = {};
    this.hiddenServiceImages = {};
    this.flightCheckoutService.selectedOfflineServices = [];
    this.flightCheckoutService.allOfflineServices = [];
    this.flightCheckoutService.organizedOfllineServices = [];
    this.flightCheckoutService.recommendedOfflineService = undefined;
    this.flightCheckoutService.serviceFees = 0;
    this.flightCheckoutService.priceWithRecommenedService = 0;

    this.offlineResponseSub?.unsubscribe();
    this.offlineResponseSub = this.flightCheckoutService.offlineServicesResponse.subscribe(() => {
      setTimeout(() => {
        this.unselectPreselectedOfflineServices();
        this.syncYesNoValues();
      });
    });

    const pos = criteria?.pos || 'EG';
    this.flightCheckoutService.getAllOfflineServices(searchId, pos, true);
    this.isPreparingOfflineServices = false;
  }

  private unselectPreselectedOfflineServices(): void {
    this.flightCheckoutService.selectedOfflineServices = [];
    this.flightCheckoutService.recommendedOfflineService = undefined;
    this.flightCheckoutService.serviceFees = 0;
    this.flightCheckoutService.priceWithRecommenedService = 0;
    this.flightCheckoutService.allOfflineServices = (this.flightCheckoutService.allOfflineServices || []).map(
      (service) => this.clearServiceSelection(service),
    );
    this.flightCheckoutService.organizedOfllineServices = (this.flightCheckoutService.organizedOfllineServices || []).map(
      (service) => this.clearServiceSelection(service),
    );
  }

  private clearServiceSelection(service: flightOfflineService): flightOfflineService {
    return {
      ...service,
      added: false,
      interaction: false,
      subServices: (service.subServices || []).map((sub) => ({
        ...sub,
        added: false,
        interaction: false,
      })),
    };
  }

  private syncYesNoValues(): void {
    (this.flightCheckoutService.allOfflineServices || []).forEach((service) => {
      if (this.normalizeServiceType(service) === 'yes/no') {
        this.yesNoValues[service.serviceCode] = this.isServiceSelected(service) ? 'yes' : '';
      }
    });
  }

  private resetLocalOfflineState(): void {
    this.clearSelectedFlightWait();
    this.offlineResponseSub?.unsubscribe();
    this.checkoutNotifySub?.unsubscribe();
    this.lastLoadedSearchId = '';
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
    return (this.flightCheckoutService.selectedOfflineServices || []).includes(service.serviceCode);
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
    if (this.hasFlightResults) {
      return this.isCurrentSearchRoundTrip();
    }
    return !!this.sharedService.getLastSmartAssistantSnapshot()?.isRoundTrip;
  }

  get isAssistantSearchLoading(): boolean {
    return !this.hasSelectedFlight && !!this.flightResultService.loading;
  }

  get hasFlightResults(): boolean {
    return !!(
      this.flightResultService.ResultFound &&
      !this.flightResultService.loading &&
      (
        this.flightResultService.response?.airItineraries?.length ||
        this.flightResultService.responseAi?.airItineraries?.length ||
        this.flightResultService.responseAi?.itineraries?.length ||
        (this.flightResultService.orgnizedResponce?.length ?? 0) > 0
      )
    );
  }

  get hasPreviousAssistantData(): boolean {
    const snapshot = this.sharedService.getLastSmartAssistantSnapshot();
    return !!(snapshot?.comparisonFlights?.length || snapshot?.recommendationSummary);
  }

  get showAssistantFlightUi(): boolean {
    return this.hasFlightResults || this.hasPreviousAssistantData;
  }

  get recommendationText(): string {
    return (
      this.flightResultService.response?.recommendation?.ai?.summary ||
      (this.flightResultService.responseAi as any)?.recommendation?.ai?.summary ||
      this.sharedService.getLastSmartAssistantSnapshot()?.recommendationSummary ||
      ''
    );
  }

  get recommendedFlight(): any {
    return this.findRecommendedFlight()
      || this.sharedService.getLastSmartAssistantSnapshot()?.recommendedFlight;
  }

  private findRecommendedFlight(): any {
    const rec = this.getRecommendationAi();
    const itineraries = this.getItinerariesForRecommendation();
    if (!rec || !itineraries.length) return undefined;
    const recSeq = rec.sequenceNum ?? rec.sequence;
    const recPKey = rec.pkey ?? rec.pKey;
    const recPcc = rec.pcc;
    return itineraries.find((flight: any) => this.flightMatchesRecommendation(flight, recSeq, recPKey, recPcc));
  }

  private getRecommendationAi(): any {
    return (
      (this.flightResultService.response as any)?.recommendation?.ai ||
      (this.flightResultService.responseAi as any)?.recommendation?.ai ||
      this.sharedService.getSavedFlightSearchResponseAi()?.recommendation?.ai ||
      null
    );
  }

  private getItinerariesForRecommendation(): any[] {
    const res = this.flightResultService.response as any;
    const resAi = this.flightResultService.responseAi as any;
    const saved = this.sharedService.getSavedFlightSearchResponseAi();
    const candidates = [
      res?.airItineraries,
      resAi?.airItineraries,
      resAi?.itineraries,
      res?.itineraries,
      saved?.airItineraries,
      saved?.itineraries,
      saved?.data?.airItineraries,
    ];
    const direct = candidates.find((list) => Array.isArray(list) && list.length > 0);
    if (direct) return direct;

    const organized = this.flightResultService.orgnizedResponce;
    if (Array.isArray(organized) && organized.length > 0) {
      return organized.map((group) => (Array.isArray(group) ? group[0] : group));
    }
    return this.sharedService.getLastSmartAssistantSnapshot()?.comparisonFlights || [];
  }

  private flightMatchesRecommendation(flight: any, sequenceNum: unknown, pKey: unknown, pcc: unknown): boolean {
    if (!flight) return false;
    const seqMatch = String(flight.sequenceNum ?? '').trim() === String(sequenceNum ?? '').trim();
    const keyMatch = String(flight.pKey ?? '').trim() === String(pKey ?? '').trim();
    const itemPcc = String(flight.pcc ?? '').trim();
    const recPcc = String(pcc ?? '').trim();
    const pccMatch = !itemPcc || !recPcc || itemPcc === recPcc;
    return seqMatch && keyMatch && pccMatch;
  }

  persistAssistantSnapshot() {
    if (this.isAssistantSearchLoading) return;
    const comparisonFlights = this.getCurrentComparisonFlights();
    if (!comparisonFlights.length) return;
    const recommendationSummary =
      this.flightResultService.response?.recommendation?.ai?.summary ||
      (this.flightResultService.responseAi as any)?.recommendation?.ai?.summary ||
      '';
    this.sharedService.saveSmartAssistantSnapshot({
      comparisonFlights,
      recommendationSummary,
      isRoundTrip: this.isCurrentSearchRoundTrip(),
      recommendedFlight: this.findRecommendedFlight(),
    });
  }

  private isCurrentSearchRoundTrip(): boolean {
    return (
      this.flightResultService.response?.searchCriteria?.flightType === 'RoundTrip' ||
      this.flightResultService.responseAi?.searchCriteria?.flightType === 'RoundTrip'
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
    const current = this.getCurrentComparisonFlights();
    if (current.length > 0) {
      return current;
    }
    return this.sharedService.getLastSmartAssistantSnapshot()?.comparisonFlights || [];
  }

  private getCurrentComparisonFlights(): any[] {
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

  get selectedFlightCurrency(): string {
    return this.flightCheckoutService.selectedFlight?.airItineraryDTO?.itinTotalFare?.currencyCode
      || this.selectedServicesCurrency
      || 'EGP';
  }

  get totalFareInBase(): number {
    const itin = this.flightCheckoutService.selectedFlight?.airItineraryDTO?.itinTotalFare;
    return this.convertToBaseAmount(itin?.amount ?? 0, itin?.currencyCode);
  }

  get totalFareWithGateway(): number {
    return this.totalFareInBase + this.convertToBaseAmount(this.sharedService.selectedGatewayAmount, 'EGP');
  }

  getPassengerDisplayedFare(fare: {
    passengerType?: string;
    passengerQuantity?: number;
    flightFaresDTOs?: { fareType?: string; fareAmount?: number; currencyCode?: string }[] | null;
  } | null): number {
    const totalFare = fare?.flightFaresDTOs?.find((item) => item.fareType === 'TotalFare');
    const fareAmount = totalFare?.fareAmount ?? 0;
    const markup =
      this.flightCheckoutService.selectedFlight?.airItineraryDTO?.itinTotalFare?.mValue ?? 0;
    const quantity = fare?.passengerQuantity || 1;
    const rawAmount = markup > 0 && fare?.passengerType === 'ADT'
      ? fareAmount + markup / quantity
      : fareAmount;
    return this.convertToBaseAmount(
      rawAmount,
      totalFare?.currencyCode || this.selectedFlightCurrency,
    );
  }

  getServiceDisplayedPrice(service: { servicePrice?: number; currency?: string } | null): number {
    return this.convertToBaseAmount(
      service?.servicePrice ?? 0,
      service?.currency || this.selectedServicesCurrency,
    );
  }

  convertToBaseAmount(price: number, sourceCurrency?: string | null): number {
    const amount = Number(price);
    if (!Number.isFinite(amount)) return 0;
    const sourceCode = String(sourceCurrency || 'EGP').trim().toUpperCase();
    if (sourceCode === 'EGP') return amount;
    const source = this.homePageService.allCurrency.find(
      (currency) => currency.Currency_Code === sourceCode,
    );
    const sourceRate = Number(source?.rate);
    if (!sourceRate) return amount;
    return amount / sourceRate;
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  openStopsModal(flight: any) {
    if (!flight) return;
    this.stopsTriggered.emit({ itinerary: flight, index: -1 });
  }

  closeStopsModal() {
    this.showStopsModal = false;
    this.selectedLeg = null;
  }
}
