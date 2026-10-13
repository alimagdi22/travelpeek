import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { FlightCheckoutApiService, FlightCheckoutService, FlightResultService, UserProfileService } from 'rp-travel-ui';
import { SharedService } from '../../shared/shared.service';
import { MyTripsComponent } from './my-trips.component';

describe('MyTripsComponent search results (mocked API)', () => {
  let fixture: ComponentFixture<MyTripsComponent>;
  let component: MyTripsComponent;
  let flightResultService: any;
  let sharedService: any;

  const mockItinerary = {
    sequenceNum: 1,
    pKey: 'pkey-1',
    allJourney: {
      flights: [
        {
          flightAirline: { airlineCode: 'MS', airlineLogo: '', airlineName: 'EgyptAir' },
          flightDTO: [
            {
              flightAirline: { airlineName: 'EgyptAir' },
              departureTerminalAirport: { airportCode: 'CAI' },
              arrivalTerminalAirport: { airportCode: 'DXB' },
              departureDate: '2026-09-29T08:00:00',
              arrivalDate: '2026-09-29T12:00:00',
            },
          ],
        },
      ],
    },
    itinTotalFare: { amount: 5400, currencyCode: 'EGP' },
    totalDuration: 240,
  };

  const mockSearchResult = {
    airItineraries: [mockItinerary],
    searchCriteria: {
      flights: [
        {
          departingFrom: 'CAI',
          arrivingTo: 'DXB',
          departingOnDate: '2026-09-29T00:00:00',
        },
      ],
    },
  };

  beforeEach(async () => {
    const notify$ = new Subject<void>();
    const message$ = new Subject<any>();
    const selectedItinerary$ = new Subject<any>();
    const toggleMobileHistory$ = new Subject<boolean>();
    const selectQuery$ = new Subject<any>();

    flightResultService = {
      loading: false,
      ResultFound: false,
      response: undefined,
      responseAi: undefined,
      orgnizedResponce: [],
      normalError: '',
      normalErrorStatus: false,
      conversationsLoading: false,
      conversationError: undefined,
      conversationResponse: undefined,
      searchHistoryResponse: undefined,
      searchHistoryLoading: false,
      bookResponseAi: undefined,
      ContactResponseAi: undefined,
      notify: notify$,
      brandedFareNotifier: new Subject<void>(),
      getDataFromAiUrl: jasmine.createSpy('getDataFromAiUrl').and.callFake(() => {
        flightResultService.loading = true;
      }),
      searchFromVoice: jasmine.createSpy('searchFromVoice').and.callFake((file: File, chatId: string, onTranscript?: (text: string) => Promise<string>) => {
        flightResultService.loading = true;
        const transcript = 'I want to travel from Cairo to Dubai on October 23.';
        const pendingChatId = onTranscript?.(transcript);
        Promise.resolve(pendingChatId).then((nextChatId) => {
          flightResultService.getDataFromAiUrl({
            chat: transcript,
            chatID: nextChatId || chatId,
          });
        });
      }),
      getSearchHistory: jasmine.createSpy('getSearchHistory'),
      getConversationDetails: jasmine.createSpy('getConversationDetails'),
      getContactDetails: jasmine.createSpy('getContactDetails'),
      bookFromAiUrl: jasmine.createSpy('bookFromAiUrl'),
      uploadPassportFromAiUrl: jasmine.createSpy('uploadPassportFromAiUrl'),
      uploadPassportResponseAi: undefined,
      getBrandedFares: jasmine.createSpy('getBrandedFares'),
      currentSelectedBrands: [],
    };

    sharedService = {
      conversationId: 'chat-test-1',
      travellersDetails: { contactDetails: null, travellers: {} },
      message$,
      selectedItinerary$,
      toggleMobileHistory$,
      selectQuery$,
      addMessage: jasmine.createSpy('addMessage').and.callFake((msg: any) => message$.next(msg)),
      getSearchQuery: () => null,
      clearSearchQuery: () => undefined,
      consumePendingVoiceSearch: () => ({ file: null, transcript: '' }),
      setSelectedItinerary: jasmine.createSpy('setSelectedItinerary'),
      saveSmartAssistantSnapshot: jasmine.createSpy('saveSmartAssistantSnapshot'),
      clearSmartAssistantSnapshot: jasmine.createSpy('clearSmartAssistantSnapshot'),
      getLastSmartAssistantSnapshot: () => null,
    };

    await TestBed.configureTestingModule({
      declarations: [MyTripsComponent],
      imports: [FormsModule],
      providers: [
        { provide: FlightResultService, useValue: flightResultService },
        { provide: SharedService, useValue: sharedService },
        {
          provide: UserProfileService,
          useValue: {
            notify: new Subject<void>(),
            user: { firstName: 'Ali', lastName: 'Tester', userName: 'ali' },
            getUserProfile: jasmine.createSpy('getUserProfile'),
          },
        },
        {
          provide: FlightCheckoutService,
          useValue: {
            destroyer: jasmine.createSpy('destroyer'),
            paymentError: false,
            selectedFlightError: false,
            payLaterSuccess: null,
            serviceFees: 0,
            selectedFlight: null,
          },
        },
        {
          provide: FlightCheckoutApiService,
          useValue: {
            addPaymentGateways: jasmine.createSpy('addPaymentGateways').and.returnValue(of([])),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MyTripsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  function flushSystemMessages() {
    let guard = 0;
    while (guard++ < 10) {
      const animating = component.messages.find((m) => m.isAnimating);
      if (animating) {
        component.onTypewriterComplete(animating);
        continue;
      }
      break;
    }
  }

  function completeMockedSearch(response: any, options?: { organized?: any[]; error?: string }) {
    flightResultService.response = response.airItineraries ? response : undefined;
    flightResultService.responseAi = response;
    flightResultService.orgnizedResponce = options?.organized ?? [];
    flightResultService.ResultFound = !!(
      response?.airItineraries?.length ||
      response?.itineraries?.length ||
      response?.output
    );
    flightResultService.normalError = options?.error ?? '';
    flightResultService.normalErrorStatus = !!options?.error;
    flightResultService.loading = false;
  }

  it('uses airItineraries when orgnizedResponce is an empty array', () => {
    flightResultService.orgnizedResponce = [];
    flightResultService.responseAi = mockSearchResult;

    expect(component.getFilteredItineraries().length).toBe(1);
    expect(component.getFilteredItineraries()[0].pKey).toBe('pkey-1');
  });

  it('shows flight cards instead of the error after a successful mocked search', fakeAsync(() => {
    component.sendMessage('flights from Cairo to Dubai tomorrow 1 adult economy');
    tick();

    expect(flightResultService.getDataFromAiUrl).toHaveBeenCalledWith({
      chat: 'flights from Cairo to Dubai tomorrow 1 adult economy',
      chatID: component.chatID,
    });

    completeMockedSearch(mockSearchResult, {
      organized: [],
      error: 'Something went wrong. Please try again later.',
    });

    tick(300);
    flushSystemMessages();
    discardPeriodicTasks();

    const resultMsg = [...component.messages].reverse().find((m) => m.sender === 'system' && m.itineraries);
    expect(resultMsg).toBeTruthy();
    expect(resultMsg?.itineraries?.length).toBe(1);
    expect(resultMsg?.text).not.toContain('Something went wrong');
    expect(resultMsg?.text).not.toContain('No flights found');
    expect(component.isSmartAssistantVisible).toBeTrue();
  }));

  it('shows AI output without treating an empty organized list as a failed search', fakeAsync(() => {
    component.sendMessage('hello');
    tick();

    completeMockedSearch(
      { output: 'Hello! I can help you book flights.' },
      { organized: [], error: 'Something went wrong. Please try again later.' },
    );

    tick(300);
    flushSystemMessages();
    discardPeriodicTasks();

    const systemMsgs = component.messages.filter((m) => m.sender === 'system');
    const lastSystem = systemMsgs[systemMsgs.length - 1];
    expect(lastSystem.text).toContain('Hello! I can help you book flights.');
    expect(lastSystem.itineraries).toBeUndefined();
    expect(lastSystem.text).not.toContain('Something went wrong');
  }));

  it('sends searchMessage as a follow-up and then shows the mocked flight result', fakeAsync(() => {
    component.sendMessage('something new');
    tick();

    completeMockedSearch({
      output: 'I recommend searching for beach destinations.',
      searchMessage: 'beach destination',
    });

    tick(300);
    flushSystemMessages();

    expect(flightResultService.getDataFromAiUrl).toHaveBeenCalledTimes(2);
    expect(flightResultService.getDataFromAiUrl.calls.mostRecent().args[0]).toEqual({
      chat: 'beach destination',
      chatID: component.chatID,
    });

    const followUpUserMsg = component.messages.find(
      (m) => m.sender === 'user' && m.text === 'beach destination',
    );
    expect(followUpUserMsg).toBeFalsy();

    completeMockedSearch(mockSearchResult, { organized: [] });
    tick(300);
    flushSystemMessages();
    discardPeriodicTasks();

    const resultMsg = [...component.messages].reverse().find((m) => m.sender === 'system' && m.itineraries);
    expect(resultMsg).toBeTruthy();
    expect(resultMsg?.itineraries?.length).toBe(1);
    expect(resultMsg?.text).not.toContain('Something went wrong');
  }));

  it('does not follow up when searchMessage is null', fakeAsync(() => {
    component.sendMessage('hello');
    tick();

    completeMockedSearch({ output: 'Hello! How can I help you?', searchMessage: null });
    tick(300);
    flushSystemMessages();
    discardPeriodicTasks();

    expect(flightResultService.getDataFromAiUrl).toHaveBeenCalledTimes(1);
    const lastSystem = [...component.messages].reverse().find((m) => m.sender === 'system');
    expect(lastSystem?.text).toContain('Hello! How can I help you?');
  }));

  it('does not follow up when searchMessage is empty', fakeAsync(() => {
    component.sendMessage('hello');
    tick();

    completeMockedSearch({ output: 'Hello! How can I help you?', searchMessage: '   ' });
    tick(300);
    flushSystemMessages();
    discardPeriodicTasks();

    expect(flightResultService.getDataFromAiUrl).toHaveBeenCalledTimes(1);
  }));

  it('keeps typed text in front of the live voice transcript', () => {
    component.newMessage = 'Hello';
    (component as any).typedBeforeVoice = 'Hello';
    component.applyVoiceTranscript('flights to Dubai');
    expect(component.newMessage).toBe('Hello flights to Dubai');
  });

  it('shows the live voice transcript as the client message then searches normally', fakeAsync(() => {
    const transcript = 'I want to travel from Cairo to Dubai on October 23.';
    component.applyVoiceTranscript(transcript);
    expect(component.newMessage).toBe(transcript);

    component.submitChat();
    tick();

    const userMsg = component.messages.find(
      (m) => m.sender === 'user' && m.text === transcript,
    );
    expect(userMsg).toBeTruthy();
    expect(flightResultService.getDataFromAiUrl).toHaveBeenCalledWith({
      chat: transcript,
      chatID: component.chatID,
    });

    completeMockedSearch(mockSearchResult, { organized: [] });
    tick(300);
    flushSystemMessages();
    discardPeriodicTasks();

    const resultMsg = [...component.messages].reverse().find((m) => m.sender === 'system' && m.itineraries);
    expect(resultMsg?.itineraries?.length).toBe(1);
    expect(component.newMessage).toBe('');
  }));

  it('uploads the recorded audio and still shows the live transcript as the client message', fakeAsync(() => {
    const transcript = 'I want to travel from Cairo to Dubai on October 23.';
    const file = new File(['audio'], 'voice.webm', { type: 'audio/webm' });
    (component as any).sendVoiceMessage(file, transcript);
    tick();

    const userMsg = component.messages.find(
      (m) => m.sender === 'user' && m.text === transcript,
    );
    expect(userMsg).toBeTruthy();
    expect(flightResultService.searchFromVoice).toHaveBeenCalled();
    expect(flightResultService.searchFromVoice.calls.mostRecent().args[0]).toBe(file);
    tick();
    expect(flightResultService.getDataFromAiUrl.calls.mostRecent().args[0].chat).toBe(transcript);
  }));

  it('shows extracted passport details with confirm and edit instead of booking immediately', fakeAsync(() => {
    component.selectedItinerary = mockItinerary as any;
    component.passengerList = [{ type: 'adult', index: 1 }];
    component.currentPassengerIndex = 0;
    const file = new File(['img'], 'passport.jpg', { type: 'image/jpeg' });

    flightResultService.uploadPassportFromAiUrl.and.callFake(() => {
      flightResultService.loading = false;
      flightResultService.normalErrorStatus = false;
      flightResultService.uploadPassportResponseAi = {
        passport_number: 'A303919869',
        first_name: 'MOETAZ',
        last_name: 'ABDELHAKIM',
        nationality: 'EGYPTIAN',
        date_of_birth: '1981-08-16',
        gender: 'M',
        expiry_date: '2029-04-26',
      };
    });

    component.onFileSelected({ target: { files: [file], value: '' } });
    tick(250);
    flushSystemMessages();
    discardPeriodicTasks();

    expect(flightResultService.uploadPassportFromAiUrl).toHaveBeenCalledWith(file, component.chatID);
    const detailsMsg = component.messages.find(
      (m) => m.sender === 'system' && m.showPassportReview && m.text.includes('MOETAZ') && m.text.includes('A303919869'),
    );
    expect(detailsMsg).toBeTruthy();
    expect(detailsMsg?.text).toContain('EGYPTIAN');
    expect(detailsMsg?.text).toContain('2029-04-26');
    expect(component.messages.some((m) => m.isPayment)).toBeFalse();
    expect(flightResultService.bookFromAiUrl).not.toHaveBeenCalled();
  }));

  it('sends the book request after confirming scanned passport details', fakeAsync(() => {
    component.selectedItinerary = mockItinerary as any;
    component.passengerList = [{ type: 'adult', index: 1 }];
    component.currentPassengerIndex = 0;
    component.isEnteringNamesManually = true;
    const reviewMsg = {
      sender: 'system' as const,
      text: 'Passport details',
      showPassportReview: true,
      passportTraveler: {
        firstName: 'MOETAZ',
        lastName: 'ABDELHAKIM',
        dateOfBirth: '1981-08-16',
        gender: 'M',
        nationality: 'EGYPTIAN',
        passportNumber: 'A303919869',
        passportExpiry: '2029-04-26',
        passportIssuedCountry: 'EGYPTIAN',
        travelerType: null,
      },
    };
    component.messages = [reviewMsg as any];

    flightResultService.bookFromAiUrl.and.callFake(() => {
      flightResultService.loading = false;
      flightResultService.bookResponseAi = {
        status: 'completed',
        reply: 'Traveler details saved.',
        missingFields: [],
        traveler: { firstName: 'MOETAZ', lastName: 'ABDELHAKIM' },
      };
    });

    component.confirmPassportDetails(reviewMsg as any);
    tick();
    tick(250);
    flushSystemMessages();
    discardPeriodicTasks();

    expect(flightResultService.bookFromAiUrl).toHaveBeenCalled();
    const bookPayload = flightResultService.bookFromAiUrl.calls.mostRecent().args[0];
    expect(bookPayload.chat).toContain('MOETAZ');
    expect(bookPayload.chat).toContain('A303919869');
    expect(component.messages.some((m) => m.isPayment)).toBeTrue();
  }));

  it('opens the passenger form with scanned values when edit is clicked', () => {
    component.passengerList = [{ type: 'adult', index: 1 }];
    component.currentPassengerIndex = 0;
    const reviewMsg = {
      sender: 'system' as const,
      text: 'Passport details',
      showPassportReview: true,
      passengerLabel: 'Adult 1',
      passengerType: 'adult' as const,
      passportTraveler: {
        firstName: 'MOETAZ',
        lastName: 'ABDELHAKIM',
        dateOfBirth: '1981-08-16',
        gender: 'M',
        nationality: 'EGYPTIAN',
        passportNumber: 'A303919869',
        passportExpiry: '2029-04-26',
        passportIssuedCountry: 'EGYPTIAN',
        travelerType: null,
      },
    };
    component.messages = [reviewMsg as any];

    component.editPassportDetails(reviewMsg as any);

    const formMsg = [...component.messages].reverse().find((m) => m.showPassengerForm);
    expect(formMsg).toBeTruthy();
    expect(formMsg?.passengerFormPrefill?.firstName).toBe('MOETAZ');
    expect(formMsg?.passengerFormPrefill?.lastName).toBe('ABDELHAKIM');
    expect(formMsg?.passengerFormPrefill?.birthDate).toBe('1981-08-16');
    expect(formMsg?.passengerFormPrefill?.passportNumber).toBe('A303919869');
    expect(formMsg?.passengerFormPrefill?.passportExpiry).toBe('2029-04-26');
    expect(formMsg?.passengerFormPrefill?.gender).toBe('Mr');
    expect(formMsg?.passengerFormPrefill?.issueCountry).toBe('EGYPTIAN');
    expect(component.messages.some((m) => m.isPayment)).toBeFalse();
  }));

  it('shows an error when passport upload fails', fakeAsync(() => {
    component.selectedItinerary = mockItinerary as any;
    const file = new File(['img'], 'passport.jpg', { type: 'image/jpeg' });

    flightResultService.uploadPassportFromAiUrl.and.callFake(() => {
      flightResultService.loading = false;
      flightResultService.normalErrorStatus = true;
      flightResultService.normalError = 'Something went wrong. Please try again later.';
    });

    component.onFileSelected({ target: { files: [file], value: '' } });
    tick(250);
    flushSystemMessages();
    discardPeriodicTasks();

    const errorMsg = [...component.messages].reverse().find((m) => m.sender === 'system');
    expect(errorMsg?.text).toContain('Something went wrong. Please try again later.');
    expect(component.messages.some((m) => m.isPayment)).toBeFalse();
  }));
});
