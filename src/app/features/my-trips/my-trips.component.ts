import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FlightResultService, IAirItinerary, UserProfileService } from 'rp-travel-ui';
import { SharedService } from '../../shared/shared.service';
import { Subscription } from 'rxjs';
import { DatePipe } from '@angular/common';

interface FlightCard {
  airline: string;
  badge: 'FASTEST' | 'CHEAPEST' | null;
  badgeClass: string;
  depTime: string;
  depCode: string;
  arrTime: string;
  arrCode: string;
  duration: string;
  stops: string;
  price: string;
}

interface Message {
  sender: 'user' | 'system';
  text: string;
  timestamp: Date;
  flights?: FlightCard[];
  itineraries?: IAirItinerary[];
  isFlightSelection?: boolean;
  showBookingPrompt?: boolean;
  passengerCountLabel?: string;
}

@Component({
  selector: 'app-my-trips',
  standalone: false,
  templateUrl: './my-trips.component.html',
  styleUrl: './my-trips.component.scss',
})
export class MyTripsComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  newMessage: string = '';
  isTyping: boolean = false;
  chatID: string = '';
  searchHistory: string[] = [];
  isMobileHistoryOpen: boolean = false;

  flightResultService = inject(FlightResultService);
  sharedService = inject(SharedService);
  profileService = inject(UserProfileService);
  private subscription = new Subscription();

  suggestions: string[] = [
    'Add travel insurance',
    'Check visa requirements',
    'Window seat preference',
  ];

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
    const initials = parts.map((p: string) => p.charAt(0)).join('').toUpperCase();
    return initials.slice(0, 2) || 'U';
  }

  get userDisplayName(): string {
    if (!this.isLoggedIn) return 'Guest';
    const user = this.profileService.user;
    return user?.userName || user?.email || 'User';
  }

  ngOnInit() {
    this.generateChatId();

    // Listen to user profile notify events to refresh history on login/logout
    this.subscription.add(
      this.profileService.notify.subscribe(() => {
        this.loadSearchHistory();
      })
    );

    // Listen to flight selection events
    this.subscription.add(
      this.sharedService.selectedItinerary$.subscribe((itinerary) => {
        if (itinerary) {
          this.handleFlightSelection(itinerary);
        }
      })
    );

    // Listen to messages pushed from shared service
    this.subscription.add(
      this.sharedService.message$.subscribe((msg) => {
        if (msg) {
          this.messages.push(msg);
          this.scrollToBottom();
        }
      })
    );

    if (this.isLoggedIn) {
      this.profileService.getUserProfile();
      this.loadSearchHistory();
    }

    const query = this.sharedService.getSearchQuery();
    if (query) {
      this.sharedService.clearSearchQuery();
      this.sendMessage(query);
    } else {
      this.initializeChat();
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadSearchHistory() {
    if (!this.isLoggedIn) {
      this.searchHistory = [];
      return;
    }
    const email = this.profileService.user?.email || 'guest';
    const raw = localStorage.getItem(`travelpeek_history_${email}`);
    this.searchHistory = raw ? JSON.parse(raw) : [];
  }

  saveSearchHistory(text: string) {
    if (!this.isLoggedIn || !text.trim()) return;
    const email = this.profileService.user?.email || 'guest';
    const key = `travelpeek_history_${email}`;
    const raw = localStorage.getItem(key);
    let history: string[] = raw ? JSON.parse(raw) : [];
    history = history.filter(item => item.toLowerCase() !== text.toLowerCase());
    history.unshift(text);
    if (history.length > 20) {
      history = history.slice(0, 20);
    }
    localStorage.setItem(key, JSON.stringify(history));
    this.searchHistory = history;
  }

  clearSearchHistory() {
    const email = this.profileService.user?.email || 'guest';
    localStorage.removeItem(`travelpeek_history_${email}`);
    this.searchHistory = [];
  }

  toggleMobileHistory(isOpen?: boolean) {
    this.isMobileHistoryOpen = isOpen !== undefined ? isOpen : !this.isMobileHistoryOpen;
  }

  generateChatId() {
    this.chatID = Math.floor(100000 + Math.random() * 900000).toString();
  }

  startNewChat() {
    this.messages = [];
    this.generateChatId();
    this.flightResultService.responseAi = undefined;
    this.flightResultService.ResultFound = false;
    this.flightResultService.normalError = '';
  }

  initializeChat() {
    this.messages = [
      {
        sender: 'system',
        text: 'Hello! I am your AI travel assistant. Where would you like to travel today?',
        timestamp: new Date(),
      }
    ];
  }

  sendMessage(text: string) {
    if (!text.trim()) return;

    // Save history
    this.saveSearchHistory(text);

    // Add user message
    this.sharedService.addMessage({
      sender: 'user',
      text: text
    });

    this.newMessage = '';
    const textarea = document.querySelector('.chat-input-field-v2') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
    }

    // Scroll to bottom
    this.scrollToBottom();

    // Trigger system response typing simulation
    this.isTyping = true;

    // Call the AI search API
    this.flightResultService.getDataFromAiUrl({
      chat: text,
      chatID: this.chatID,
    });

    const checkInterval = setInterval(() => {
      if (!this.flightResultService.loading) {
        clearInterval(checkInterval);
        this.isTyping = false;

        let replyText = '';
        const responseAi = this.flightResultService.responseAi;

        if (responseAi && responseAi.output) {
          replyText = responseAi.output;
        } else if (
          !this.flightResultService.ResultFound ||
          !responseAi
        ) {
          const rawError = this.flightResultService.normalError;
          let errorMessage = 'No flights found matching your query. Please try again.';
          if (rawError) {
            if (typeof rawError === 'string') {
              errorMessage = rawError;
            } else if (typeof rawError === 'object') {
              errorMessage = (rawError as any).message || (rawError as any).error?.message || 'Failed to search flights. Please try again later.';
            }
          }
          replyText = errorMessage;
        } else {
          replyText = `Found flights matching your search: "${text}".`;
        }

        const resultFound = this.flightResultService.ResultFound;
        const airItineraries = this.flightResultService.responseAi?.airItineraries || this.flightResultService.responseAi?.itineraries;

        this.sharedService.addMessage({
          sender: 'system',
          text: replyText,
          itineraries: resultFound && airItineraries ? [...airItineraries] : undefined,
        });

        this.scrollToBottom();
      }
    }, 200);
  }

  selectSuggestion(suggestion: string) {
    this.sendMessage(suggestion);
  }

  scrollSuggestions(element: HTMLElement, direction: string) {
    const item = element.querySelector('.suggestion-slider-item');
    if (!item) return;
    const itemWidth = item.getBoundingClientRect().width;
    const scrollAmount = itemWidth + 8; // item width + gap
    element.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  }

  onInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage(this.newMessage);
    }
  }

  adjustTextareaHeight(textarea: any) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  handleFlightSelection(itinerary: IAirItinerary) {
    const passengerLabel = this.getPassengersCountLabel();
    const passengerLabelLower = passengerLabel.toLowerCase();

    const outbound = itinerary?.allJourney?.flights?.[0] ?? null;
    const airlineName = outbound?.flightDTO?.[0]?.flightAirline?.airlineName ?? 'Emirates';
    const destCity = outbound?.flightDTO ? (outbound.flightDTO[outbound.flightDTO.length - 1]?.arrivalTerminalAirport?.cityName ?? 'Dubai') : 'Dubai';

    // Outbound details for user message
    const deptDate = outbound?.flightDTO?.[0]?.departureDate ?? '';
    const segs = outbound?.flightDTO;
    const arrDate = segs && segs.length > 0 ? (segs[segs.length - 1]?.arrivalDate ?? '') : '';
    let cabinClass = outbound?.flightDTO?.[0]?.flightInfo?.cabinClass || itinerary?.cabinClass || '';
    cabinClass = cabinClass.trim();
    if (cabinClass && !cabinClass.toLowerCase().includes('class')) {
      cabinClass = cabinClass + ' Class';
    }

    const datePipe = new DatePipe('en-US');
    const formattedDept = datePipe.transform(deptDate, 'hh:mm a, EEE d MMMM yyyy') || deptDate;
    const formattedArr = datePipe.transform(arrDate, 'hh:mm a, EEE d MMMM yyyy') || arrDate;

    // 1. Add user message saying "I selected the flight with..."
    const userMsgText = `I selected the flight with ${airlineName}, departure date ${formattedDept}, arrival date ${formattedArr} and class ${cabinClass}`;
    this.sharedService.addMessage({
      sender: 'user',
      text: userMsgText
    });

    // 2. Add selected flight and prompt as a single unified system message
    const promptText = `Excellent choice. I'm ready to book your ${airlineName} flight to ${destCity}. To finalize the booking, I need a few more details. Could you provide the email, phone number, passport number, passport expiry date, issue country, and current country, birthdate or upload a passport copy of the ${passengerLabelLower}?`;

    this.sharedService.addMessage({
      sender: 'system',
      text: promptText,
      itineraries: [itinerary],
      isFlightSelection: true,
      passengerCountLabel: passengerLabel,
      showBookingPrompt: true
    });

    // Clear the selected itinerary to prevent re-triggering
    this.sharedService.setSelectedItinerary(null);
  }

  getPassengersCountLabel(): string {
    const criteria = this.flightResultService.responseAi?.searchCriteria;
    if (!criteria) return '';
    const parts: string[] = [];
    if (criteria.adultNum > 0) {
      parts.push(`${criteria.adultNum} Adult${criteria.adultNum > 1 ? 's' : ''}`);
    }
    if (criteria.childNum > 0) {
      parts.push(`${criteria.childNum} Child${criteria.childNum > 1 ? 'ren' : ''}`);
    }
    if (criteria.infantNum > 0) {
      parts.push(`${criteria.infantNum} Infant${criteria.infantNum > 1 ? 's' : ''}`);
    }
    return parts.join(', ');
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      // Add a user message indicating file upload
      this.sharedService.addMessage({
        sender: 'user',
        text: `Uploaded passport copy: ${file.name}`
      });

      // Simulate system processing the passport
      this.isTyping = true;
      setTimeout(() => {
        this.isTyping = false;
        this.sharedService.addMessage({
          sender: 'system',
          text: `Thank you for uploading the passport copy (${file.name}). I have successfully received it and am now processing the details to finalize your booking.`
        });
      }, 1500);
    }
  }

  enterNamesManually() {
    this.sharedService.addMessage({
      sender: 'user',
      text: 'Enter Names Manually'
    });

    this.isTyping = true;
    setTimeout(() => {
      this.isTyping = false;
      this.sharedService.addMessage({
        sender: 'system',
        text: 'Please provide the traveler details (Full Name, Email, Phone, Passport Number, Expiry Date, Issue Country, Current Country, Birthdate) in the chat below.'
      });
    }, 1200);
  }

  scrollToBottom() {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 50);
  }
}
