import { Component, inject, OnInit } from '@angular/core';
import { FlightResultService, IAirItinerary } from 'rp-travel-ui';
import { SharedService } from '../../shared/shared.service';

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
export class MyTripsComponent implements OnInit {
  messages: Message[] = [];
  newMessage: string = '';
  isTyping: boolean = false;
  chatID: string = '';

  flightResultService = inject(FlightResultService);
  sharedService = inject(SharedService);

  suggestions: string[] = [
    'Add travel insurance',
    'Check visa requirements',
    'Window seat preference',
  ];

  ngOnInit() {
    this.generateChatId();
    const query = this.sharedService.getSearchQuery();
    if (query) {
      this.sharedService.clearSearchQuery();
      this.sendMessage(query);
    } else {
      this.initializeChat();
    }
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

    // Add user message
    this.messages.push({
      sender: 'user',
      text: text,
      timestamp: new Date(),
    });

    this.newMessage = '';

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

        let replyText = `Found flights matching your search: "${text}".`;
        if (
          !this.flightResultService.ResultFound ||
          !this.flightResultService.responseAi
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

  scrollToBottom() {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 50);
  }
}
