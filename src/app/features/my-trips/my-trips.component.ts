import { Component, inject, NgZone, OnInit, OnDestroy, DoCheck, AfterViewChecked, ViewChild, ElementRef, DestroyRef, HostListener } from '@angular/core';
import { FormArray } from '@angular/forms';
import { FlightResultService, IAirItinerary, IFlight, UserProfileService, FlightCheckoutApiService, FlightCheckoutService } from 'rp-travel-ui';
import { SharedService } from '../../shared/shared.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { DatePipe } from '@angular/common';
import { Message } from '../../core/models/message.interface';
import { PassengerFormData } from './components/passenger-form/passenger-form.component';
@Component({
  selector: 'app-my-trips',
  standalone: false,
  templateUrl: './my-trips.component.html',
  styleUrl: './my-trips.component.scss',
})
export class MyTripsComponent implements OnInit, AfterViewChecked, OnDestroy, DoCheck {
  @ViewChild('suggestionsSlider') suggestionsSliderRef?: ElementRef<HTMLElement>;
  private swiperInitialized = false;

  readonly isMyTrips: boolean = true;
  messages: Message[] = [];
  newMessage: string = '';
  isTyping: boolean = false;
  isVoiceRecorderOpen = false;
  isListening = false;
  voiceRecorderError = '';
  readonly maxRecordingSeconds = 35;
  isRecording = false;
  recordingSeconds = 0;
  private speechRecognition: {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives?: number;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: any) => void) | null;
    onerror: ((event: any) => void) | null;
    onend: (() => void) | null;
  } | null = null;
  private typedBeforeVoice = '';
  private restartSpeechRecognition = false;
  private speechRestartTimer: ReturnType<typeof setTimeout> | null = null;
  private speechErrorCount = 0;
  private currentSpeechLang = 'en-US';
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private recordingChunks: Blob[] = [];
  private recordingTimer: ReturnType<typeof setInterval> | null = null;
  private recordingLimitTimer: ReturnType<typeof setTimeout> | null = null;
  private stopPromise: Promise<File | null> | null = null;
  private recordingStopResolver: ((file: File | null) => void) | null = null;
  private discardNextRecording = false;
  chatID: string = '';
  get searchHistory(): any[] {
    const res = this.flightResultService.searchHistoryResponse;
    return res && res.success && res.data ? res.data : [];
  }
  isMobileHistoryOpen: boolean = false;

  flightResultService = inject(FlightResultService);
  sharedService = inject(SharedService);
  flightCheckoutServiceApi = inject(FlightCheckoutApiService);
  flightCheckoutService = inject(FlightCheckoutService);
  profileService = inject(UserProfileService);
  private zone = inject(NgZone);
  private subscription = new Subscription();
  private filterFormSub: Subscription | null = null;
  private systemAnimationQueue: Message[] = [];
  private isSystemAnimating = false;
  private didFollowUpSearch = false;
  private didShowFollowUpClientMessage = false;
  private searchGeneration = 0;
  isSmartAssistantVisible = false;
  selectedItinerary: IAirItinerary | null = null;
  isEnteringNamesManually = false;
  isEnteringContactDetails = false;
  airlineName = '';
  destCity = '';
  suggestions: string[] = [
    'Add travel insurance',
    'Check visa requirements',
    'Window seat preference',
  ];

  passengerList: Array<{ type: 'adult' | 'child' | 'infant'; index: number }> = [];
  currentPassengerIndex: number = 0;

  initializePassengerList() {
    const criteria = this.flightResultService.response?.searchCriteria || this.flightResultService.responseAi?.searchCriteria;
    this.passengerList = [];
    this.currentPassengerIndex = 0;
    if (!criteria) return;

    if (criteria.adultNum > 0) {
      for (let i = 1; i <= criteria.adultNum; i++) {
        this.passengerList.push({ type: 'adult', index: i });
      }
    }
    if (criteria.childNum > 0) {
      for (let i = 1; i <= criteria.childNum; i++) {
        this.passengerList.push({ type: 'child', index: i });
      }
    }
    if (criteria.infantNum > 0) {
      for (let i = 1; i <= criteria.infantNum; i++) {
        this.passengerList.push({ type: 'infant', index: i });
      }
    }

    // Initialize travellersDetails object dynamically
    const travellersObj: any = {};
    for (const passenger of this.passengerList) {
      const key = `${passenger.type}${passenger.index}`;
      travellersObj[key] = {};
    }
    this.sharedService.travellersDetails = {
      contactDetails: {},
      travellers: travellersObj
    };
  }

  getPassengerLabel(passenger: { type: 'adult' | 'child' | 'infant'; index: number } | undefined): string {
    if (!passenger) return 'passenger';
    const typeCapitalized = passenger.type.charAt(0).toUpperCase() + passenger.type.slice(1);
    return `${typeCapitalized} ${passenger.index}`;
  }

  ngAfterViewChecked() {
    if (!this.swiperInitialized && this.suggestionsSliderRef?.nativeElement) {
      this.initSuggestionsSwiper();
      this.swiperInitialized = true;
    }
  }

  private initSuggestionsSwiper() {
    const el = this.suggestionsSliderRef?.nativeElement;
    if (!el) return;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    el.addEventListener('mousedown', (e: MouseEvent) => {
      isDown = true;
      el.classList.add('is-dragging');
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    });
    el.addEventListener('mouseleave', () => {
      isDown = false;
      el.classList.remove('is-dragging');
    });
    el.addEventListener('mouseup', () => {
      isDown = false;
      el.classList.remove('is-dragging');
    });
    el.addEventListener('mousemove', (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      el.scrollLeft = scrollLeft - walk;
    });
  }

  ngOnInit() {
    const initQuery = this.sharedService.getSearchQuery();
    if (initQuery) {
      this.sharedService.setSelectedItinerary(null);
    }

    this.generateChatId();

    // Listen to user profile notify events to refresh history on login/logout
    this.subscription.add(
      this.profileService.notify.subscribe(() => {
        this.loadSearchHistory();
      }),
    );

    // Listen to flight selection events
    this.subscription.add(
      this.sharedService.selectedItinerary$.subscribe((itinerary) => {
        if (itinerary) {
          this.showStopsModal = false;
          this.handleFlightSelection(itinerary);
        }
      }),
    );

    // Listen to messages pushed from shared service
    this.subscription.add(
      this.sharedService.message$.subscribe((msg) => {
        if (msg) {
          if (msg.sender === 'system') {
            msg.isAnimating = false;
            // Prevent duplicate consecutive system messages
            const lastMsg = this.messages[this.messages.length - 1];
            if (
              lastMsg &&
              lastMsg.sender === 'system' &&
              lastMsg.text &&
              msg.text &&
              lastMsg.text.trim() === msg.text.trim()
            ) {
              return;
            }
            this.systemAnimationQueue.push(msg);
            this.processNextSystemAnimation();
          } else {
            const lastMsg = this.messages[this.messages.length - 1];
            if (
              lastMsg &&
              lastMsg.sender === 'user' &&
              lastMsg.text &&
              msg.text &&
              lastMsg.text.trim() === msg.text.trim()
            ) {
              return;
            }
            this.messages.push(msg);
            this.scrollToBottom();
          }
        }
      }),
    );

    // Listen to mobile history toggle events
    this.subscription.add(
      this.sharedService.toggleMobileHistory$.subscribe((open) => {
        this.isMobileHistoryOpen = open;
      })
    );

    // Listen to query selections from mobile header drawer
    this.subscription.add(
      this.sharedService.selectQuery$.subscribe((query) => {
        if (query) {
          this.onHistorySelect(query);
        }
      })
    );

    // Listen to filter updates to update the active flight message itineraries
    this.subscription.add(
      this.flightResultService.notify.subscribe(() => {
        if (this.messages.length > 0) {
          const flightMsg = [...this.messages].reverse().find(m => m.sender === 'system' && m.itineraries);
          if (flightMsg) {
            flightMsg.itineraries = this.getFilteredItineraries();
          }
        }
        if (this.flightResultService.filterForm) {
          this.subscribeToFilterChanges();
        }
      })
    );

    if (this.isLoggedIn) {
      this.profileService.getUserProfile();
      this.loadSearchHistory();
    }

    const pendingVoice = this.sharedService.consumePendingVoiceSearch();
    const query = this.sharedService.getSearchQuery();
    if (pendingVoice.file) {
      this.sharedService.clearSearchQuery();
      this.sharedService.setSelectedItinerary(null);
      this.initializeChat();
      this.sendVoiceMessage(pendingVoice.file, pendingVoice.transcript);
    } else if (query) {
      this.sharedService.clearSearchQuery();
      this.sendMessage(query);
    } else {
      this.initializeChat();
    }
  }
  get isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  get userInitials(): string {
    if (!this.isLoggedIn) return 'G';
    const user = this.profileService.user;
    if (!user) return 'U';
    const name = user.userName || user.email || '';
    if (!name) return 'U';
    const parts = name.split(/[ @._-]/).filter(Boolean);
    const initials = parts
      .map((p: string) => p.charAt(0))
      .join('')
      .toUpperCase();
    return initials.slice(0, 2) || 'U';
  }

  get userDisplayName(): string {
    if (!this.isLoggedIn) return 'Guest';
    const user = this.profileService.user;
    console.log(user,'user');

    return (user.firstName + ' ' +user.lastName) || user?.userName || user?.email || 'User';
  }

  get userFirstName(): string {
    if (!this.isLoggedIn) return 'Traveler';
    const user = this.profileService.user;
    if (user?.firstName) return user.firstName;
    if (user?.userName) return user.userName.trim().split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'Traveler';
  }

  formatAiMessageText(text: string): string {
    if (!text) return '';

    const displayName = this.userFirstName;
    let formatted = text;

    // Replace UUIDs (8-4-4-4-12 hex string format, e.g. 019fa84d-674c-78ff-bb0d-457f18f6652f)
    const uuidRegex = /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g;
    formatted = formatted.replace(uuidRegex, displayName);

    // Replace current chatID if set and longer than 3 chars
    if (this.chatID && this.chatID.length > 3) {
      const chatIDRegex = new RegExp(`\\b${this.chatID}\\b`, 'g');
      formatted = formatted.replace(chatIDRegex, displayName);
    }

    return formatted;
  }

  defaultSearchLoadingMessages: string[] = [
    'Searching best flight options...',
    'Analyzing itinerary & live fares...',
    'Checking real-time availability...',
    'Crafting your travel response...'
  ];

  contactLoadingMessages: string[] = [
    'Processing your contact details...',
    'Verifying email & phone number...',
    'Saving contact information...',
    'Preparing traveler details...'
  ];

  passengerLoadingMessages: string[] = [
    'Processing passenger information...',
    'Verifying passport & traveler details...',
    'Updating booking records...',
    'Preparing reservation details...'
  ];

  passportScanLoadingMessages: string[] = [
    'Scanning passport document...',
    'Extracting traveler details via OCR...',
    'Verifying passport information...'
  ];

  paymentLoadingMessages: string[] = [
    'Connecting to secure payment gateway...',
    'Preparing checkout details...',
    'Verifying payment options...'
  ];

  activeLoadingMessages: string[] = [];
  currentLoadingMessageIndex: number = 0;
  private loadingMessageInterval: any = null;

  get currentLoadingMessage(): string {
    const list = this.activeLoadingMessages.length > 0 ? this.activeLoadingMessages : this.defaultSearchLoadingMessages;
    return list[this.currentLoadingMessageIndex] || 'AI Assistant is thinking...';
  }

  startLoadingMessageCycle(messages?: string[]) {
    this.activeLoadingMessages = messages && messages.length > 0 ? messages : this.defaultSearchLoadingMessages;
    this.currentLoadingMessageIndex = 0;
    this.stopLoadingMessageCycle();
    this.loadingMessageInterval = setInterval(() => {
      this.currentLoadingMessageIndex = (this.currentLoadingMessageIndex + 1) % this.activeLoadingMessages.length;
    }, 2200);
  }

  humanLoadingMessages: string[] = [
    "Thinking...",
    "Gathering information for you...",
    "Crafting a response...",
    "Just a moment, putting this together...",
    "Almost ready..."
  ];

  showSlowLoadingMessage: boolean = false;
  slowLoadingMessage: string = '';
  private slowLoadingTimer: any = null;
  private slowLoadingInterval: any = null;
  private currentSlowMessageIndex: number = 0;
  private isCurrentlyLoading: boolean = false;

  get isChatLoading(): boolean {
    return !!(this.flightResultService?.loading || this.isTyping);
  }

  ngDoCheck(): void {
    const loading = this.isChatLoading;
    if (loading && !this.isCurrentlyLoading) {
      this.isCurrentlyLoading = true;
      this.startHumanLoadingCycle();
    } else if (!loading && this.isCurrentlyLoading) {
      this.isCurrentlyLoading = false;
      this.clearHumanLoadingCycle();
    }
  }

  private startHumanLoadingCycle(): void {
    this.clearHumanLoadingCycle();
    this.showSlowLoadingMessage = false;
    this.currentSlowMessageIndex = 0;

    this.slowLoadingTimer = setTimeout(() => {
      if (this.isChatLoading) {
        this.slowLoadingMessage = this.humanLoadingMessages[0];
        this.showSlowLoadingMessage = true;

        this.slowLoadingInterval = setInterval(() => {
          if (this.isChatLoading) {
            this.currentSlowMessageIndex = (this.currentSlowMessageIndex + 1) % this.humanLoadingMessages.length;
            this.slowLoadingMessage = this.humanLoadingMessages[this.currentSlowMessageIndex];
          }
        }, 4000);
      }
    }, 5000);
  }

  private clearHumanLoadingCycle(): void {
    if (this.slowLoadingTimer) {
      clearTimeout(this.slowLoadingTimer);
      this.slowLoadingTimer = null;
    }
    if (this.slowLoadingInterval) {
      clearInterval(this.slowLoadingInterval);
      this.slowLoadingInterval = null;
    }
    this.showSlowLoadingMessage = false;
    this.slowLoadingMessage = '';
  }

  stopLoadingMessageCycle() {
    if (this.loadingMessageInterval) {
      clearInterval(this.loadingMessageInterval);
      this.loadingMessageInterval = null;
    }
  }

  ngOnDestroy() {
    this.clearHumanLoadingCycle();
    this.stopLoadingMessageCycle();
    this.stopVoice({ cancel: true });
    this.subscription.unsubscribe();
    this.resetFlightServiceState();
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent) {
    event.preventDefault();
    event.returnValue = '';
  }

  canLeavePage(): boolean {
    return window.confirm('Are you sure you want to leave? Your current chat will be lost.');
  }

  resetFlightServiceState() {
    if (this.flightResultService) {
      this.flightResultService.response = undefined;
      this.flightResultService.responseAi = undefined;
      this.flightResultService.bookResponseAi = undefined;
      this.flightResultService.ResultFound = false;
      this.flightResultService.normalError = '';
      this.flightResultService.orgnizedResponce = [];
    }
    this.isSmartAssistantVisible = false;
    this.sharedService.clearSmartAssistantSnapshot();
    this.resetCheckoutState();
  }

  loadSearchHistory() {
    if (!this.isLoggedIn || this.flightResultService.searchHistoryLoading)
      return;
    this.flightResultService.getSearchHistory();
  }

  saveSearchHistory(text: string) {
    // Search history is saved on the backend during AI search requests
  }

  clearSearchHistory() {
    // Clear search history is not supported by the API
  }

  onHistorySelect(item: any) {
    if (!item) return;

    // Fallback if item is just a string query
    if (typeof item === 'string') {
      this.sendMessage(item);
      return;
    }

    if (!item.id) return;

    this.resetCheckoutState();
    this.isSmartAssistantVisible = false;
    this.sharedService.clearSmartAssistantSnapshot();
    this.chatID = item.id;
    this.sharedService.conversationId = item.id;
    this.messages = [];

    this.flightResultService.getConversationDetails(item.id);

    const checkInterval = setInterval(() => {
      if (!this.flightResultService.conversationsLoading) {
        clearInterval(checkInterval);

        const error = this.flightResultService.conversationError;
        const response = this.flightResultService.conversationResponse;

        if (!error && response && response.success && response.data && response.data.items) {
          const rawMessages: Message[] = response.data.items.map((msgItem: any) => ({
            sender: (msgItem.role === 'User' ? 'user' : 'system') as 'user' | 'system',
            text: msgItem.role === 'User' ? msgItem.content : this.formatAiMessageText(msgItem.content),
            timestamp: new Date(msgItem.createdAt)
          }));
          const deduplicated: Message[] = [];
          for (const msg of rawMessages) {
            const prev = deduplicated[deduplicated.length - 1];
            if (
              prev &&
              prev.sender === msg.sender &&
              prev.text &&
              msg.text &&
              prev.text.trim() === msg.text.trim()
            ) {
              continue;
            }
            deduplicated.push(msg);
          }
          this.messages = deduplicated;
          this.scrollToBottom();
        }
      }
    }, 200);
  }

  retryConversationLoad() {
    if (this.chatID) {
      this.onHistorySelect({ id: this.chatID });
    }
  }

  toggleMobileHistory(isOpen?: boolean) {
    this.isMobileHistoryOpen =
      isOpen !== undefined ? isOpen : !this.isMobileHistoryOpen;
  }

  generateChatId() {
    this.chatID = Math.floor(100000 + Math.random() * 900000).toString();
  }

  resetCheckoutState() {
    this.selectedItinerary = null;
    this.sharedService.setSelectedItinerary(null);
    this.passengerList = [];
    this.currentPassengerIndex = 0;
    this.isEnteringNamesManually = false;
    this.isEnteringContactDetails = false;
    this.airlineName = '';
    this.destCity = '';

    if (this.flightCheckoutService) {
      this.flightCheckoutService.destroyer();
      this.flightCheckoutService.paymentError = false;
      this.flightCheckoutService.selectedFlightError = false;
      this.flightCheckoutService.payLaterSuccess = null;
    }

    if (this.sharedService) {
      this.sharedService.travellersDetails = {
        contactDetails: null,
        travellers: {}
      };
    }
  }

  startNewChat() {
    this.messages = [];
    this.systemAnimationQueue = [];
    this.isSystemAnimating = false;
    this.closeVoiceRecorder();
    this.generateChatId();
    this.resetFlightServiceState();
    if (this.filterFormSub) {
      this.filterFormSub.unsubscribe();
      this.filterFormSub = null;
    }
    this.initializeChat();
  }

  initializeChat() {
    this.messages = [];
    this.systemAnimationQueue = [];
    this.isSystemAnimating = false;
    this.resetFlightServiceState();
    this.didFollowUpSearch = false;
    this.didShowFollowUpClientMessage = false;
    this.sharedService.addMessage({
      sender: 'system',
      text: 'Hello! I am your AI travel assistant. Where would you like to travel today?',
    });
  }

  async sendMessage(text: string) {
    if (!text.trim()) return;

    this.systemAnimationQueue = [];
    this.isSystemAnimating = false;

    // Save history
    this.saveSearchHistory(text);

    // Add user message
    this.sharedService.addMessage({
      sender: 'user',
      text: text,
    });

    this.newMessage = '';
    const textarea = document.querySelector(
      '.chat-input-field-v2',
    ) as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
    }

    if (window.innerWidth <= 991) {
      this.scrollToMessageTop();
    } else {
      this.scrollToBottom();
    }
    this.isTyping = true;

    await this.ensureConversationSaved(text);

    if (this.isEnteringContactDetails) {
      this.startLoadingMessageCycle(this.contactLoadingMessages);
      // ── Contact Details Flow ──
      this.flightResultService.getContactDetails({
        chat: text,
        chatID: this.chatID,
      });

      const checkInterval = setInterval(() => {
        if (!this.flightResultService.loading) {
          clearInterval(checkInterval);
          this.isTyping = false;
          this.stopLoadingMessageCycle();

          const response = this.flightResultService.ContactResponseAi;

          if (response) {
            // Always display the system reply in the chat window
            this.sharedService.addMessage({
              sender: 'system',
              text: response.reply,
            });

            if (response.status === 'completed') {
              // Store contact details in sharedService object
              this.sharedService.travellersDetails.contactDetails = {
                phone: response.contact.phoneNumber,
                email: response.contact.email
              };

              this.isEnteringContactDetails = false;

              this.sharedService.addMessage({
                sender: 'system',
                text: 'Perfect! I now have all the required contact details.',
              });

              // Prompt for first passenger
              const firstPassenger = this.passengerList[0];
              const targetPassengerLabel = firstPassenger
                ? this.getPassengerLabel(firstPassenger)
                : 'Adult 1';

              const promptText = `Excellent choice. I'm ready to book your ${this.airlineName} flight to ${this.destCity}. To finalize the booking, I need a few more details. Could you provide the first name , last name , birthdate , passport number, passport expiry date and issue country or upload a passport copy of ${targetPassengerLabel}?`;

              this.sharedService.addMessage({
                sender: 'system',
                text: promptText,
                isFlightSelection: true,
                showBookingPrompt: true
              });
            }
          } else {
            // Error handling
            this.sharedService.addMessage({
              sender: 'system',
              text: 'Failed to process contact details. Please try again.',
            });
          }
          this.scrollToBottom();
        }
      }, 200);
    } else if (this.isEnteringNamesManually || (this.selectedItinerary && this.currentPassengerIndex < this.passengerList.length)) {
      this.startLoadingMessageCycle(this.passengerLoadingMessages);
      if (!this.isEnteringNamesManually) {
        this.isEnteringNamesManually = true;
      }
      // Build dynamic chatID
      const currentPassenger = this.passengerList[this.currentPassengerIndex];
      const suffix = currentPassenger ? `_${currentPassenger.type}${currentPassenger.index}` : '';
      const dynamicChatId = `${this.chatID}${suffix}`;

      // ── Booking Flow ──
      this.flightResultService.bookFromAiUrl({
        chat: text,
        chatID: dynamicChatId,
      });

      const checkInterval = setInterval(() => {
        if (!this.flightResultService.loading) {
          clearInterval(checkInterval);
          this.isTyping = false;

          const response = this.flightResultService.bookResponseAi;

          if (response) {
            // Always display the system reply in the chat window
            this.sharedService.addMessage({
              sender: 'system',
              text: response.reply,
            });

            // Show Secure Payment Card only if booking status is completed
            if (response.status === 'completed') {
              // Save completed traveler info to the sharedService object
              if (currentPassenger) {
                const passengerKey = `${currentPassenger.type}${currentPassenger.index}`;
                this.sharedService.travellersDetails.travellers[passengerKey] = response.traveler;
              }

              if (this.passengerList.length > 0 && this.currentPassengerIndex < this.passengerList.length - 1) {
                // Not the last passenger yet!
                const completedPassenger = this.passengerList[this.currentPassengerIndex];
                this.currentPassengerIndex++;
                const nextPassenger = this.passengerList[this.currentPassengerIndex];

                const completedLabel = this.getPassengerLabel(completedPassenger);
                const nextLabel = this.getPassengerLabel(nextPassenger);

                const transitionMessage = `Information for ${completedLabel} has been successfully recorded. Please provide the details for ${nextLabel} to continue.`;

                // Text bubble first, then form-only bubble
                this.sharedService.addMessage({
                  sender: 'system',
                  text: transitionMessage,
                });
                this.sharedService.addMessage({
                  sender: 'system',
                  text: '',
                  showPassengerForm: true,
                  passengerLabel: nextLabel,
                  passengerType: nextPassenger.type
                });
              } else {
                // Last passenger completed! Log the value
                console.log('Final travellersDetails:', this.sharedService.travellersDetails);

                // Show please wait message
                this.sharedService.addMessage({
                  sender: 'system',
                  text: 'Please wait while providing payment methods.'
                });
                this.flightResultService.loading = true;
                this.startLoadingMessageCycle(this.paymentLoadingMessages);
                this.scrollToBottom();

                const currency = this.selectedItinerary?.itinTotalFare?.currencyCode || 'AED';

                if (!this.flightCheckoutService.selectedFlight) {
                  this.flightCheckoutService.selectedFlight = {
                    searchCriteria: this.flightResultService.response?.searchCriteria || this.flightResultService.responseAi?.searchCriteria!,
                    airItineraryDTO: this.selectedItinerary!
                  } as any;
                }

                const paymentAmount = this.flightCheckoutService.selectedFlight?.airItineraryDTO?.itinTotalFare?.amount
                  ?? ((this.selectedItinerary?.itinTotalFare?.amount || 1240) + (this.flightCheckoutService.serviceFees || 0));

                this.flightCheckoutServiceApi.addPaymentGateways(currency, 'EG', this.selectedItinerary!).subscribe({
                  next: (gateways) => {
                    this.flightResultService.loading = false;
                    this.stopLoadingMessageCycle();
                    this.sharedService.addMessage({
                      sender: 'system',
                      text: '',
                      isPayment: true,
                      itineraries: this.selectedItinerary ? [this.selectedItinerary] : undefined,
                      paymentAmount,
                      paymentCurrency: currency,
                      gateways: gateways // Pass the gateways array to the component
                    });
                    this.scrollToBottom();
                  },
                  error: (err) => {
                    this.flightResultService.loading = false;
                    this.stopLoadingMessageCycle();
                    console.error('Error adding payment gateways:', err);
                    this.sharedService.addMessage({
                      sender: 'system',
                      text: 'Failed to load payment methods. Please try again.'
                    });
                    this.scrollToBottom();
                  }
                });
              }
            }
          } else {
            // Error handling
            this.sharedService.addMessage({
              sender: 'system',
              text: 'Failed to process booking details. Please try again.',
            });
          }
          this.scrollToBottom();
        }
      }, 200);
    } else {
      // ── Normal Flight Search Flow ──
      this.didFollowUpSearch = false;
      this.didShowFollowUpClientMessage = false;
      this.runAiFlightSearch(text);
    }
  }

  async submitChat() {
    if (this.isListening || this.isRecording) {
      await this.finishVoiceAndSend();
      return;
    }
    this.sendMessage(this.newMessage);
  }

  get voicePreview(): string {
    if (!this.isListening) return '';
    const typed = this.typedBeforeVoice.trim();
    const current = this.newMessage.trim();
    if (typed && current.toLowerCase().startsWith(typed.toLowerCase())) {
      return current.slice(typed.length).trim();
    }
    return current;
  }

  toggleVoiceRecorder() {
    if (this.isListening) {
      this.finishVoiceAndSend();
      return;
    }
    this.startVoice();
  }

  closeVoiceRecorder() {
    this.voiceRecorderError = '';
    this.stopVoice({ cancel: true });
  }

  startVoice() {
    this.voiceRecorderError = '';
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.voiceRecorderError = 'Voice recording is not supported in this browser.';
      this.isVoiceRecorderOpen = true;
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      this.voiceRecorderError = 'Voice recording is not supported in this browser.';
      this.isVoiceRecorderOpen = true;
      return;
    }

    const keepTyped = this.newMessage.trim();
    this.stopVoice({ cancel: true });
    this.typedBeforeVoice = keepTyped;
    this.newMessage = keepTyped;
    this.isVoiceRecorderOpen = true;
    this.isListening = true;
    this.restartSpeechRecognition = true;
    this.speechErrorCount = 0;
    this.currentSpeechLang = this.getSpeechLang();
    this.discardNextRecording = false;

    void this.beginVoiceCapture();
  }

  stopVoice(options?: { cancel?: boolean }) {
    this.stopSpeechRecognition();
    if (options?.cancel) {
      this.discardNextRecording = true;
      void this.stopMediaRecorder();
      this.newMessage = this.typedBeforeVoice;
      this.resizeChatInput();
      this.typedBeforeVoice = '';
      this.voiceRecorderError = '';
      this.isVoiceRecorderOpen = false;
      this.isListening = false;
      return;
    }
    this.typedBeforeVoice = '';
    this.isListening = false;
    if (!this.voiceRecorderError) {
      this.isVoiceRecorderOpen = false;
    }
  }

  startVoiceRecording() {
    this.startVoice();
  }

  stopVoiceRecording() {
    this.finishVoiceAndSend();
  }

  private finishVoiceAndSend() {
    const liveText = this.newMessage.trim();
    this.stopSpeechRecognition();
    return this.stopMediaRecorder().then((file) => {
      this.isListening = false;
      this.isVoiceRecorderOpen = false;
      this.typedBeforeVoice = '';
      if (file) {
        this.sendVoiceMessage(file, liveText);
        return;
      }
      if (liveText) {
        this.sendMessage(liveText);
      }
    });
  }

  applyVoiceTranscript(spoken: string) {
    const spokenText = spoken.trim();
    this.newMessage = this.typedBeforeVoice
      ? (spokenText ? `${this.typedBeforeVoice} ${spokenText}` : this.typedBeforeVoice)
      : spokenText;
    this.resizeChatInput();
  }

  private async beginVoiceCapture() {
    try {
      this.releaseMediaStream();
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      this.voiceRecorderError = 'Allow microphone access to use voice input.';
      this.isListening = false;
      this.restartSpeechRecognition = false;
      this.isVoiceRecorderOpen = true;
      return;
    }

    if (!this.isListening) {
      this.releaseMediaStream();
      return;
    }

    if (!this.startMediaRecorder(this.mediaStream)) {
      this.releaseMediaStream();
      this.isListening = false;
      this.voiceRecorderError = 'Voice recording is not supported in this browser.';
      this.isVoiceRecorderOpen = true;
      return;
    }

    const Recognition = this.getSpeechRecognitionCtor();
    if (Recognition) {
      this.beginSpeechRecognition(Recognition);
    }
  }

  private startMediaRecorder(stream: MediaStream): boolean {
    const mimeType = this.pickAudioMimeType();
    this.recordingChunks = [];
    this.recordingSeconds = 0;
    try {
      this.mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch {
      this.mediaRecorder = null;
      return false;
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data?.size) {
        this.recordingChunks.push(event.data);
      }
    };
    this.mediaRecorder.onstop = () => {
      const type = this.mediaRecorder?.mimeType || mimeType || 'audio/webm';
      const blob = new Blob(this.recordingChunks, { type });
      this.isRecording = false;
      this.clearRecordingTimers();
      this.releaseMediaStream();
      const discard = this.discardNextRecording;
      this.discardNextRecording = false;
      let file: File | null = null;
      if (!discard && blob.size > 0) {
        const extension = this.audioExtension(type);
        file = new File([blob], `voice-message.${extension}`, { type });
      }
      this.recordingStopResolver?.(file);
      this.recordingStopResolver = null;
      this.stopPromise = null;
    };

    this.mediaRecorder.start(250);
    this.isRecording = true;
    this.recordingTimer = setInterval(() => {
      this.recordingSeconds = Math.min(this.recordingSeconds + 1, this.maxRecordingSeconds);
    }, 1000);
    this.recordingLimitTimer = setTimeout(() => {
      this.finishVoiceAndSend();
    }, this.maxRecordingSeconds * 1000);
    return true;
  }

  private stopMediaRecorder(): Promise<File | null> {
    if (this.stopPromise) {
      return this.stopPromise;
    }
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      this.isRecording = false;
      this.clearRecordingTimers();
      this.releaseMediaStream();
      return Promise.resolve(null);
    }
    this.clearRecordingTimers();
    this.stopPromise = new Promise((resolve) => {
      this.recordingStopResolver = resolve;
      try {
        this.mediaRecorder?.stop();
      } catch {
        resolve(null);
        this.recordingStopResolver = null;
        this.stopPromise = null;
      }
    });
    return this.stopPromise;
  }

  private sendVoiceMessage(file: File, liveText: string) {
    if (this.isChatLoading) return;

    this.systemAnimationQueue = [];
    this.isSystemAnimating = false;
    this.isVoiceRecorderOpen = false;
    this.voiceRecorderError = '';
    this.isTyping = true;
    this.startLoadingMessageCycle(this.defaultSearchLoadingMessages);

    const displayedText = liveText.trim();
    if (displayedText) {
      this.sharedService.addMessage({
        sender: 'user',
        text: displayedText,
      });
      this.newMessage = '';
      this.resizeChatInput();
      if (window.innerWidth <= 991) {
        this.scrollToMessageTop();
      } else {
        this.scrollToBottom();
      }
    }

    const generation = ++this.searchGeneration;
    this.resetAiSearchState();

    (this.flightResultService as any).searchFromVoice(file, this.chatID, async (text: string) => {
      if (!displayedText && text) {
        this.sharedService.addMessage({
          sender: 'user',
          text,
        });
        if (window.innerWidth <= 991) {
          this.scrollToMessageTop();
        } else {
          this.scrollToBottom();
        }
      }
      return this.ensureConversationSaved(displayedText || text);
    });

    this.pollAiFlightSearch(generation);
  }

  private beginSpeechRecognition(Recognition: new () => any) {
    if (!this.isListening) return;

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = this.currentSpeechLang;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      this.speechErrorCount = 0;
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0]?.transcript || '';
      }
      this.zone.run(() => this.applyVoiceTranscript(transcript));
    };

    recognition.onerror = (event: any) => {
      const error = String(event?.error || '');
      this.zone.run(() => this.handleSpeechError(error));
    };

    recognition.onend = () => {
      this.zone.run(() => this.scheduleSpeechRestart(recognition));
    };

    this.speechRecognition = recognition;
    try {
      recognition.start();
    } catch {
      this.speechRecognition = null;
      this.restartSpeechRecognition = false;
    }
  }

  private stopSpeechRecognition() {
    this.restartSpeechRecognition = false;
    this.clearSpeechRestartTimer();
    const recognition = this.speechRecognition;
    this.speechRecognition = null;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    try {
      recognition.stop();
    } catch {
      try {
        recognition.abort();
      } catch {
        // Browser may already have stopped recognition.
      }
    }
  }

  private handleSpeechError(error: string) {
    if (error === 'no-speech' || error === 'aborted' || error === 'audio-capture') {
      return;
    }
    if (error === 'not-allowed' || error === 'service-not-allowed') {
      this.restartSpeechRecognition = false;
      return;
    }
    if (error === 'language-not-supported' && this.currentSpeechLang !== 'en-US') {
      this.currentSpeechLang = 'en-US';
      return;
    }
    this.speechErrorCount++;
    if (this.speechErrorCount >= 3) {
      this.restartSpeechRecognition = false;
    }
  }

  private scheduleSpeechRestart(recognition: { lang: string; start(): void }) {
    if (!this.restartSpeechRecognition || !this.isListening || this.speechRecognition !== recognition) {
      return;
    }

    this.typedBeforeVoice = this.newMessage.trim();
    this.clearSpeechRestartTimer();
    this.speechRestartTimer = setTimeout(() => {
      if (!this.restartSpeechRecognition || !this.isListening || this.speechRecognition !== recognition) {
        return;
      }
      recognition.lang = this.currentSpeechLang;
      try {
        recognition.start();
      } catch {
        this.restartSpeechRecognition = false;
      }
    }, 250);
  }

  private pickAudioMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ];
    return types.find((type) => MediaRecorder.isTypeSupported(type)) || '';
  }

  private audioExtension(mimeType: string): string {
    if (mimeType.includes('mp4')) return 'm4a';
    if (mimeType.includes('ogg')) return 'ogg';
    return 'webm';
  }

  private clearRecordingTimers() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    if (this.recordingLimitTimer) {
      clearTimeout(this.recordingLimitTimer);
      this.recordingLimitTimer = null;
    }
  }

  private releaseMediaStream() {
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
  }

  private getSpeechLang(): string {
    const sample = `${this.typedBeforeVoice} ${this.newMessage}`;
    if (/[\u0600-\u06FF]/.test(sample)) {
      return 'ar-SA';
    }
    return 'en-US';
  }

  private getSpeechRecognitionCtor(): (new () => any) | null {
    if (typeof window === 'undefined') return null;
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
  }

  private resizeChatInput() {
    const textarea = document.querySelector('.chat-input-field-v2') as HTMLTextAreaElement | null;
    this.adjustTextareaHeight(textarea);
  }

  private clearSpeechRestartTimer() {
    if (this.speechRestartTimer) {
      clearTimeout(this.speechRestartTimer);
      this.speechRestartTimer = null;
    }
  }

  private async ensureConversationSaved(text: string): Promise<string> {
    try {
      const conversationId = this.sharedService.conversationId;
      if (!conversationId) {
        const createRes = await firstValueFrom(this.sharedService.createConversation(text));
        if (createRes && createRes.success && createRes.data?.conversationId) {
          const newId: string = createRes.data.conversationId;
          this.sharedService.conversationId = newId;
          this.chatID = newId;
          this.flightResultService.getSearchHistory();

          try {
            await firstValueFrom(
              this.sharedService.saveMessage(newId, 'Assistant', 'Hello! I am your AI travel assistant. Where would you like to travel today?')
            );
          } catch (e) {
            console.error('Error saving greeting:', e);
          }

          try {
            await firstValueFrom(
              this.sharedService.saveMessage(newId, 'User', text)
            );
          } catch (e) {
            console.error('Error saving first user message:', e);
          }
              return newId;
        }
      }
      return conversationId || this.chatID;
    } catch (err) {
      console.error('Error saving conversation/message:', err);
    }
    return this.chatID;
  }

  private getAiSearchMessage(response: any, responseAi: any): string {
    const raw = responseAi?.searchMessage ?? response?.searchMessage;
    if (raw == null) return '';
    return String(raw).trim();
  }

  private printFollowUpAsClientMessage(searchText: string, introText?: string) {
    if (this.didShowFollowUpClientMessage || !searchText) return;
    this.didShowFollowUpClientMessage = true;

    const intro = introText ? String(introText).trim() : '';
    if (intro) {
      this.sharedService.addMessage({
        sender: 'system',
        text: this.formatAiMessageText(intro),
      });
    }

    // Do not show searchMessage as a client/user bubble.
    // this.sharedService.addMessage({
    //   sender: 'user',
    //   text: searchText,
    // });
    this.scrollToBottom();
  }

  private revealLibraryFollowUpClientMessage() {
    const followUpChat = String(
      (this.flightResultService as any).aiFollowUpSearch || '',
    ).trim();
    if (!followUpChat) return;

    this.printFollowUpAsClientMessage(
      followUpChat,
      (this.flightResultService as any).aiFollowUpOutput,
    );
  }

  private resetAiSearchState() {
    this.didFollowUpSearch = false;
    this.didShowFollowUpClientMessage = false;
    this.flightResultService.response = undefined;
    this.flightResultService.responseAi = undefined;
    this.flightResultService.ResultFound = false;
    this.flightResultService.orgnizedResponce = [];
    this.flightResultService.normalError = '';
    this.flightResultService.normalErrorStatus = false;
  }

  private runAiFlightSearch(text: string) {
    const generation = ++this.searchGeneration;
    this.resetAiSearchState();

    this.flightResultService.getDataFromAiUrl({
      chat: text,
      chatID: this.chatID,
    });

    this.pollAiFlightSearch(generation);
  }

  private pollAiFlightSearch(generation: number) {
    const checkInterval = setInterval(() => {
      if (generation !== this.searchGeneration) {
        clearInterval(checkInterval);
        return;
      }
      this.revealLibraryFollowUpClientMessage();
      if (this.flightResultService.loading) {
        return;
      }

      clearInterval(checkInterval);
      // A follow-up search can start in the same tick the first request completes.
      setTimeout(() => {
        if (generation !== this.searchGeneration) return;
        if (this.flightResultService.loading) {
          this.pollAiFlightSearch(generation);
          return;
        }
        this.handleFlightSearchCompletion();
      }, 50);
    }, 200);
  }

  private handleFlightSearchCompletion() {
    const response = this.flightResultService.response as any;
    const responseAi = this.flightResultService.responseAi as any;
    const airItineraries = this.getFilteredItineraries();
    const hasNewItineraries = airItineraries.length > 0;

    const followUpOutput = (this.flightResultService as any).aiFollowUpOutput as string | undefined;
    const libraryFollowUpChat = String(
      (this.flightResultService as any).aiFollowUpSearch || '',
    ).trim();
    if (followUpOutput) {
      this.didFollowUpSearch = true;
    }
    if (libraryFollowUpChat) {
      this.printFollowUpAsClientMessage(libraryFollowUpChat, followUpOutput);
    } else if (followUpOutput && !this.didShowFollowUpClientMessage) {
      this.sharedService.addMessage({
        sender: 'system',
        text: this.formatAiMessageText(followUpOutput),
      });
    }
    if (followUpOutput || libraryFollowUpChat) {
      (this.flightResultService as any).aiFollowUpOutput = undefined;
      (this.flightResultService as any).aiFollowUpSearch = undefined;
    }

    const searchMessage = this.getAiSearchMessage(response, responseAi);

    if (searchMessage && !hasNewItineraries && !this.didFollowUpSearch) {
      this.didFollowUpSearch = true;
      const followUpIntro =
        responseAi?.output ||
        responseAi?.text ||
        responseAi?.message ||
        response?.output ||
        response?.text ||
        response?.message;
      this.printFollowUpAsClientMessage(searchMessage, followUpIntro);
      this.isTyping = true;
      this.startLoadingMessageCycle(this.defaultSearchLoadingMessages);
      this.scrollToBottom();
      this.runAiFlightSearch(searchMessage);
      return;
    }

    this.isTyping = false;
    this.stopLoadingMessageCycle();

    const aiOutput =
      responseAi?.output ||
      responseAi?.text ||
      responseAi?.message ||
      response?.output ||
      response?.text ||
      response?.message;

    let replyText = '';
    if (aiOutput) {
      replyText = aiOutput;
    } else if (hasNewItineraries) {
      const flight = response?.searchCriteria?.flights?.[0] || responseAi?.searchCriteria?.flights?.[0];
      const deptFrom = flight?.departingFrom || '';
      const arrTo = flight?.arrivingTo || '';
      const deptDate = flight?.departingOnDate ? flight.departingOnDate.split('T')[0] : '';
      replyText = `Found flights matching your search: from "${deptFrom}" to "${arrTo}" on "${deptDate}".`;
    } else {
      const rawError = this.flightResultService.normalError;
      let errorMessage =
        'No flights found matching your query. Please try again.';
      if (rawError) {
        if (typeof rawError === 'string') {
          errorMessage = rawError;
        } else if (typeof rawError === 'object') {
          errorMessage =
            (rawError as any).message ||
            (rawError as any).error?.message ||
            'Failed to search flights.';
        }
      }
      replyText = errorMessage;
    }

    if (hasNewItineraries) {
      this.isSmartAssistantVisible = true;
      this.sharedService.saveSmartAssistantSnapshot({
        comparisonFlights: airItineraries,
        recommendationSummary:
          response?.recommendation?.ai?.summary ||
          responseAi?.recommendation?.ai?.summary ||
          '',
        isRoundTrip:
          (response?.searchCriteria?.flightType || responseAi?.searchCriteria?.flightType) === 'RoundTrip',
      });
      this.messages.forEach(m => {
        if (m.sender === 'system') {
          m.itineraries = undefined;
        }
      });
    }

    replyText = this.formatAiMessageText(replyText);

    this.sharedService.addMessage({
      sender: 'system',
      text: replyText,
      itineraries: hasNewItineraries ? airItineraries : undefined,
    });

    if (hasNewItineraries) {
      this.scrollToLastSystemMessage();
    } else {
      this.scrollToBottom();
    }
  }

  selectSuggestion(suggestion: string) {
    this.sendMessage(suggestion);
  }

  scrollSuggestions(element: HTMLElement, direction: string) {
    const item = element.querySelector('.suggestion-slider-item');
    if (!item) return;
    const itemWidth = item.getBoundingClientRect().width;
    const scrollAmount = itemWidth + 8; // item width + gap
    element.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }

  onInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submitChat();
    }
  }

  adjustTextareaHeight(textarea: any) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  handleFlightSelection(itinerary: IAirItinerary) {
    if (this.flightCheckoutService) {
      this.flightCheckoutService.paymentError = false;
      this.flightCheckoutService.selectedFlightError = false;
      this.flightCheckoutService.payLaterSuccess = null;
    }
    this.initializePassengerList();
    const passengerLabel = this.getPassengersCountLabel();
    this.selectedItinerary = itinerary;
    const outbound = itinerary?.allJourney?.flights?.[0] ?? null;
    this.airlineName =
      outbound?.flightDTO?.[0]?.flightAirline?.airlineName ?? 'Emirates';
    this.destCity = outbound?.flightDTO
      ? (outbound.flightDTO[outbound.flightDTO.length - 1]
          ?.arrivalTerminalAirport?.cityName ?? 'Dubai')
      : 'Dubai';

    this.isEnteringContactDetails = true;
    this.isEnteringNamesManually = false;

    // Outbound details for user message
    const deptDate = outbound?.flightDTO?.[0]?.departureDate ?? '';
    const segs = outbound?.flightDTO;
    const arrDate =
      segs && segs.length > 0 ? (segs[segs.length - 1]?.arrivalDate ?? '') : '';
    let cabinClass =
      outbound?.flightDTO?.[0]?.flightInfo?.cabinClass ||
      itinerary?.cabinClass ||
      '';
    cabinClass = cabinClass.trim();
    if (cabinClass && !cabinClass.toLowerCase().includes('class')) {
      cabinClass = cabinClass + ' Class';
    }

    const datePipe = new DatePipe('en-US');
    const formattedDept =
      datePipe.transform(deptDate, 'hh:mm a, EEE d MMMM yyyy') || deptDate;
    const formattedArr =
      datePipe.transform(arrDate, 'hh:mm a, EEE d MMMM yyyy') || arrDate;

    // 1. Add user message saying "I selected the flight with..."
    const userMsgText = `I selected the flight with ${this.airlineName}, departure date ${formattedDept}, arrival date ${formattedArr} and class ${cabinClass}`;
    this.sharedService.addMessage({
      sender: 'user',
      text: userMsgText,
    });

    // 2. Add selected flight
    this.sharedService.addMessage({
      sender: 'system',
      text: '',
      itineraries: [itinerary],
      isFlightSelection: true,
      passengerCountLabel: passengerLabel,
    });

    // 3. Prompt for contact details — text bubble first, then form-only bubble
    const promptText = `Please provide contact details, phone and email.`;
    this.sharedService.addMessage({
      sender: 'system',
      text: promptText,
    });
    this.sharedService.addMessage({
      sender: 'system',
      text: '',
      showContactForm: true,
    });

    if (window.innerWidth <= 991) {
      this.scrollToMessageTop();
    } else {
      this.scrollToBottom();
    }
  }

  getPassengersCountLabel(): string {
    const criteria = this.flightResultService.response?.searchCriteria || this.flightResultService.responseAi?.searchCriteria;
    if (!criteria) return '';
    const parts: string[] = [];
    if (criteria.adultNum > 0) {
      parts.push(
        `${criteria.adultNum} Adult${criteria.adultNum > 1 ? 's' : ''}`,
      );
    }
    if (criteria.childNum > 0) {
      parts.push(
        `${criteria.childNum} Child${criteria.childNum > 1 ? 'ren' : ''}`,
      );
    }
    if (criteria.infantNum > 0) {
      parts.push(
        `${criteria.infantNum} Infant${criteria.infantNum > 1 ? 's' : ''}`,
      );
    }
    return parts.join(', ');
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      // Add a user message indicating file upload
      this.sharedService.addMessage({
        sender: 'user',
        text: `Uploaded passport copy: ${file.name}`,
      });

      if (window.innerWidth <= 991) {
        this.scrollToMessageTop();
      } else {
        this.scrollToBottom();
      }

      // Simulate system processing the passport
      this.isTyping = true;
      this.startLoadingMessageCycle(this.passportScanLoadingMessages);
      setTimeout(() => {
        this.isTyping = false;
        this.stopLoadingMessageCycle();
        this.sharedService.addMessage({
          sender: 'system',
          text: `Thank you for uploading the passport copy (${file.name}). I have successfully received it and processed the details.`,
        });
        this.sharedService.addMessage({
          sender: 'system',
          text: '',
          isPayment: true,
          itineraries: this.selectedItinerary
            ? [this.selectedItinerary]
            : undefined,
          paymentAmount: this.flightCheckoutService.selectedFlight?.airItineraryDTO?.itinTotalFare?.amount
            || ((this.selectedItinerary?.itinTotalFare?.amount || 1240) + (this.flightCheckoutService.serviceFees || 0)),
          paymentCurrency:
            this.selectedItinerary?.itinTotalFare?.currencyCode || 'AED',
        });
      }, 1500);
    }
  }

  disableCurrentActionButtons() {
    this.messages.forEach(m => {
      m.actionsDisabled = true;
    });
  }

  enterNamesManually() {
    this.disableCurrentActionButtons();
    this.sharedService.addMessage({
      sender: 'user',
      text: 'Enter Names Manually',
    });

    if (window.innerWidth <= 991) {
      this.scrollToMessageTop();
    } else {
      this.scrollToBottom();
    }

    this.isTyping = true;
    this.startLoadingMessageCycle(this.passengerLoadingMessages);
    this.isEnteringNamesManually = true; // Switch context to booking flow

    setTimeout(() => {
      this.isTyping = false;
      this.stopLoadingMessageCycle();
      const currentPassenger = this.passengerList[this.currentPassengerIndex] || this.passengerList[0];
      const targetPassengerLabel = currentPassenger
        ? this.getPassengerLabel(currentPassenger)
        : (this.getPassengersCountLabel().toLowerCase() || 'passenger');
      const promptText = `I need a few more details. Could you provide the first name, last name, gender, birthdate , passport number, passport expiry date and issue country or upload a passport copy of ${targetPassengerLabel}?`;

      // Text bubble first, then form-only bubble
      this.sharedService.addMessage({
        sender: 'system',
        text: promptText,
      });
      this.sharedService.addMessage({
        sender: 'system',
        text: '',
        showPassengerForm: true,
        passengerLabel: targetPassengerLabel,
        passengerType: currentPassenger ? currentPassenger.type : 'adult'
      });
    }, 1200);
  }

  onContactFormSubmitted(data: { email: string; phone: string }) {
    this.disableCurrentActionButtons();
    const text = `my email is ${data.email} and my phone is ${data.phone}`;
    this.sendMessage(text);
  }

  onPassengerFormSubmitted(data: PassengerFormData) {
    this.disableCurrentActionButtons();
    this.sendMessage(data.formattedChatMessage);
  }

  scrollToBottom() {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
      if (window.innerWidth <= 991) {
        const targetY = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight
        );
        window.scrollTo({
          top: targetY,
          behavior: 'smooth'
        });
      }
    }, 50);
  }

  scrollToLastSystemMessage() {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages-container');
      if (chatContainer) {
        const systemRows = chatContainer.querySelectorAll('.message-row.system-row');
        if (systemRows && systemRows.length > 0) {
          const lastSystemRow = systemRows[systemRows.length - 1] as HTMLElement;
          if (lastSystemRow) {
            // Scroll the inner container
            chatContainer.scrollTo({
              top: lastSystemRow.offsetTop - 10,
              behavior: 'smooth'
            });

            // For mobile layout
            if (window.innerWidth <= 991) {
              const elementRect = lastSystemRow.getBoundingClientRect();
              const header = document.querySelector('header') || document.querySelector('.header-mobile') || document.querySelector('.main-header');
              const headerHeight = header ? header.getBoundingClientRect().height : 70;
              const targetY = window.pageYOffset + elementRect.top - headerHeight - 10;
              window.scrollTo({
                top: targetY,
                behavior: 'smooth'
              });
            }
          }
        }
      }
    }, 150);
  }

  private processNextSystemAnimation() {
    if (this.isSystemAnimating || this.systemAnimationQueue.length === 0) {
      return;
    }

    const nextMsg = this.systemAnimationQueue.shift();
    if (!nextMsg) return;

    this.messages.push(nextMsg);

    if (nextMsg.text && nextMsg.text.trim().length > 0) {
      this.isSystemAnimating = true;
      nextMsg.isAnimating = true;
      this.scrollToLastSystemMessage();
    } else {
      nextMsg.isAnimating = false;
      this.scrollToLastSystemMessage();
      this.processNextSystemAnimation();
    }
  }

  onTypewriterComplete(msg: Message) {
    msg.isAnimating = false;
    this.isSystemAnimating = false;
    this.processNextSystemAnimation();
  }

  scrollToMessageTop() {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages-container');
      if (chatContainer) {
        const userRows = chatContainer.querySelectorAll('.message-row.user-row');
        if (userRows && userRows.length > 0) {
          const lastUserRow = userRows[userRows.length - 1] as HTMLElement;
          if (lastUserRow) {
            // 1. Calculate absolute page position relative to sticky header
            const elementRect = lastUserRow.getBoundingClientRect();
            const header = document.querySelector('header') || document.querySelector('.header-mobile') || document.querySelector('.main-header');
            const headerHeight = header ? header.getBoundingClientRect().height : 70;
            const targetY = window.pageYOffset + elementRect.top - headerHeight - 16;

            // 2. Scroll the entire window
            window.scrollTo({
              top: targetY,
              behavior: 'smooth'
            });

            // 3. Fallback for inner container scroll
            chatContainer.scrollTo({
              top: lastUserRow.offsetTop - 16,
              behavior: 'smooth'
            });
          }
        }
      }
    }, 150);
  }

  getFilteredItineraries(): any[] {
    const organized = this.flightResultService.orgnizedResponce;
    if (Array.isArray(organized) && organized.length > 0) {
      return organized.map(group => (Array.isArray(group) ? group[0] : group)).slice(0, 5);
    }
    const res = this.flightResultService.response as any;
    const resAi = this.flightResultService.responseAi as any;
    const candidates = [
      res?.airItineraries,
      resAi?.airItineraries,
      resAi?.itineraries,
      res?.itineraries,
      resAi?.data?.airItineraries,
      resAi?.data?.itineraries,
      res?.data?.airItineraries,
      res?.data?.itineraries,
    ];
    const direct = candidates.find((list) => Array.isArray(list) && list.length > 0);
    return direct ? direct.slice(0, 5) : [];
  }

  get hasFlightResults(): boolean {
    const hasMsgWithItineraries = this.messages.some(m => m.sender === 'system' && m.itineraries !== undefined && m.itineraries !== null);
    return !!(
      hasMsgWithItineraries &&
      this.flightResultService.ResultFound &&
      (
        this.flightResultService.response?.airItineraries?.length ||
        this.flightResultService.responseAi?.airItineraries?.length ||
        this.flightResultService.responseAi?.itineraries?.length ||
        (this.flightResultService.orgnizedResponce?.length ?? 0) > 0
      )
    );
  }

  // ── Modal State Variables ──
  private destroyRef = inject(DestroyRef);
  private policySubscription: Subscription | null = null;

  showPolicyModal = false;
  isLoadingPolicy = false;
  selectedItineraryForPolicy: IAirItinerary | null = null;
  cancelPenalties: any[] = [];
  changePenalties: any[] = [];
  adminCharges: any[] = [];

  showStopsModal = false;
  selectedItineraryForStops: IAirItinerary | null = null;
  selectedStopsIndex = 0;

  // ── Modal Helper Methods ──
  openCancelPolicy(itinerary: IAirItinerary) {
    this.selectedItineraryForPolicy = itinerary;
    this.showPolicyModal = true;
    this.isLoadingPolicy = true;
    this.cancelPenalties = [];
    this.changePenalties = [];
    this.adminCharges = [];

    const response = this.flightResultService.response || this.flightResultService.responseAi;
    const searchId = response?.searchCriteria?.searchId || '';
    const sequenceNum = itinerary.sequenceNum;
    const pKey = itinerary.pKey;
    const pcc = itinerary.pcc || '';

    if (this.policySubscription) {
      this.policySubscription.unsubscribe();
    }

    this.policySubscription = this.flightResultService.brandedFareNotifier.subscribe({
      next: () => {
        this.isLoadingPolicy = false;
        this.extractFareRules();
      },
      error: (err) => {
        this.isLoadingPolicy = false;
        this.extractFareRules();
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.policySubscription) {
        this.policySubscription.unsubscribe();
      }
    });

    this.flightResultService.getBrandedFares(searchId, sequenceNum, pKey, pcc);
  }

  extractFareRules() {
    const itinerary = this.selectedItineraryForPolicy;
    if (!itinerary) return;

    const brand = this.flightResultService.currentSelectedBrands?.[0];
    const fareBreakdown = brand?.passengerFareBreakDowns?.[0] || itinerary?.passengerFareBreakDownDTOs?.[0];

    if (fareBreakdown) {
      this.cancelPenalties = fareBreakdown.cancelPenaltyDTOs || [];
      this.changePenalties = fareBreakdown.changePenaltyDTOs || [];
    }

    if (brand?.adminCharges) {
      this.adminCharges = brand.adminCharges;
    }
  }

  closePolicyModal() {
    this.showPolicyModal = false;
    if (this.policySubscription) {
      this.policySubscription.unsubscribe();
      this.policySubscription = null;
    }
  }

  getSectors(itinerary: IAirItinerary): string[] {
    const sectors: string[] = [];
    itinerary?.allJourney?.flights?.forEach((flight, index) => {
      const departureAirportCode = flight.flightDTO[0].departureTerminalAirport.airportCode;
      const arrivalAirportCode = flight.flightDTO[flight.flightDTO.length - 1].arrivalTerminalAirport.airportCode;
      sectors[index] = departureAirportCode + '-' + arrivalAirportCode;
    });
    return sectors;
  }

  getTotalPrice(itinerary: IAirItinerary): number {
    return itinerary?.itinTotalFare?.amount ?? 0;
  }

  getCurrencyCode(itinerary: IAirItinerary): string {
    return itinerary?.itinTotalFare?.currencyCode ?? '';
  }

  openStopsModal(itinerary: any, legIndex: number = 0) {
    this.selectedItineraryForStops = itinerary;
    this.selectedStopsIndex = legIndex || 0;
    this.showStopsModal = true;
  }

  closeStopsModal() {
    this.showStopsModal = false;
  }

  getActiveLeg(): IFlight | null {
    if (!this.selectedItineraryForStops) return null;
    const itin = this.selectedItineraryForStops as any;
    if (itin.flightDTO) {
      return itin as IFlight;
    }
    const flights = itin.allJourney?.flights || itin.flights;
    return flights && flights.length > this.selectedStopsIndex ? flights[this.selectedStopsIndex] : (flights?.[0] || itin);
  }

  getDeptCity(flight: IFlight): string {
    return flight?.flightDTO?.[0]?.departureTerminalAirport?.cityName ?? '';
  }

  getDeptCode(flight: IFlight): string {
    return flight?.flightDTO?.[0]?.departureTerminalAirport?.airportCode ?? '';
  }

  getArrCity(flight: IFlight): string {
    const segs = flight?.flightDTO;
    return segs && segs.length > 0 ? (segs[segs.length - 1]?.arrivalTerminalAirport?.cityName ?? '') : '';
  }

  getArrCode(flight: IFlight): string {
    const segs = flight?.flightDTO;
    return segs && segs.length > 0 ? (segs[segs.length - 1]?.arrivalTerminalAirport?.airportCode ?? '') : '';
  }

  formatTransitTime(time: string | number): string {
    if (time === null || time === undefined) return '';
    if (typeof time === 'number') {
      const hours = Math.floor(time / 60);
      const mins = time % 60;
      return `${hours}h ${mins}m`;
    }
    return time.toString();
  }

  // ── Filter Pills Helper Methods ──
  toggleDirectFlightsOnly() {
    if (!this.flightResultService.filterForm) return;
    const control = this.flightResultService.filterForm.get('stopsForm')?.get('noStops');
    if (control) {
      control.setValue(!control.value);
    }
  }

  isDirectFlightsOnlyActive(): boolean {
    return !!this.flightResultService.filterForm?.get('stopsForm')?.get('noStops')?.value;
  }

  toggleRefundableOnly() {
    if (!this.flightResultService.filterForm) return;
    const control = this.flightResultService.filterForm.get('flexibleTickets')?.get('refund');
    if (control) {
      control.setValue(!control.value);
    }
  }

  isRefundableOnlyActive(): boolean {
    return !!this.flightResultService.filterForm?.get('flexibleTickets')?.get('refund')?.value;
  }

  getTopAirlineIndex(): number {
    const airlines: any[] = this.flightResultService.airlinesA || [];
    if (airlines.length === 0) return -1;
    const egyptIdx = airlines.findIndex((a: any) => {
      if (typeof a === 'string') {
        const lower = a.toLowerCase();
        return lower === 'ms' || lower.includes('egypt');
      }
      if (typeof a === 'object' && a !== null) {
        const code = (a.airlineCode || '').toLowerCase();
        const name = (a.airlineName || '').toLowerCase();
        return code === 'ms' || name.includes('egypt');
      }
      return false;
    });
    if (egyptIdx !== -1) return egyptIdx;
    return 0;
  }

  getTopAirlineName(): string {
    const airlines: any[] = this.flightResultService.airlinesA || [];
    if (airlines.length === 0) return 'EgyptAir';
    const idx = this.getTopAirlineIndex();
    const target = idx !== -1 ? airlines[idx] : airlines[0];
    if (!target) return 'EgyptAir';
    if (typeof target === 'string') {
      return target === 'MS' ? 'EgyptAir' : target;
    }
    if (typeof target === 'object' && target !== null) {
      return (target as any).airlineName || (target as any).airlineCode || 'EgyptAir';
    }
    return 'EgyptAir';
  }

  toggleTopAirline() {
    if (!this.flightResultService.filterForm) return;
    const airlines = this.flightResultService.airlinesA;
    if (!airlines || airlines.length === 0) return;

    const idx = this.getTopAirlineIndex();
    if (idx === -1) return;

    const formArray = this.flightResultService.filterForm.get('airline')?.get('airlines') as FormArray;
    if (formArray && formArray.at(idx)) {
      const currentVal = formArray.at(idx).value;
      formArray.at(idx).setValue(!currentVal);
    }
  }

  isTopAirlineActive(): boolean {
    if (!this.flightResultService.filterForm) return false;
    const airlines = this.flightResultService.airlinesA;
    if (!airlines || airlines.length === 0) return false;

    const idx = this.getTopAirlineIndex();
    if (idx === -1) return false;

    const formArray = this.flightResultService.filterForm.get('airline')?.get('airlines') as FormArray;
    return !!(formArray && formArray.at(idx)?.value);
  }

  // ── Depart Schedule Filter Helper Methods ──
  departScheduleOptions = [
    { title: 'Morning', icon: '🌅', startTime: '00:00', endTime: '05:59' },
    { title: 'Noon', icon: '☀️', startTime: '06:00', endTime: '11:59' },
    { title: 'Afternoon', icon: '🌇', startTime: '12:00', endTime: '17:59' },
    { title: 'Night', icon: '🌙', startTime: '18:00', endTime: '23:59' },
  ];

  toggleDepartSchedule(startTime: string, endTime: string) {
    if (!this.flightResultService.filterForm) return;
    const control = this.flightResultService.filterForm.get('goingFlightScheduleDepart');
    if (control) {
      if (
        control.get('startTime')?.value === startTime &&
        control.get('endTime')?.value === endTime
      ) {
        control.get('startTime')?.setValue('');
        control.get('endTime')?.setValue('');
      } else {
        control.get('startTime')?.setValue(startTime);
        control.get('endTime')?.setValue(endTime);
      }
    }
  }

  isDepartScheduleActive(startTime: string, endTime: string): boolean {
    if (!this.flightResultService.filterForm) return false;
    const control = this.flightResultService.filterForm.get('goingFlightScheduleDepart');
    return (
      control?.get('startTime')?.value === startTime &&
      control?.get('endTime')?.value === endTime
    );
  }

  subscribeToFilterChanges() {
    if (this.filterFormSub) {
      this.filterFormSub.unsubscribe();
    }
    if (!this.flightResultService.filterForm) return;

    this.filterFormSub = this.flightResultService.filterForm.valueChanges.subscribe(() => {
      setTimeout(() => {
        const filtered = this.getFilteredItineraries();
        this.messages.forEach(msg => {
          if (msg.sender === 'system' && msg.itineraries !== undefined) {
            msg.itineraries = filtered;
          }
        });
      }, 50);
    });
    this.subscription.add(this.filterFormSub);
  }
}
