import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FlightResultService, IAirItinerary, UserProfileService } from 'rp-travel-ui';
import { SharedService } from '../../shared/shared.service';
import { Subscription } from 'rxjs';

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
    this.messages.push({
      sender: 'user',
      text: text,
      timestamp: new Date(),
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
        const airItineraries = this.flightResultService.responseAi?.airItineraries;

        this.messages.push({
          sender: 'system',
          text: replyText,
          timestamp: new Date(),
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

  scrollToBottom() {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 50);
  }
}
