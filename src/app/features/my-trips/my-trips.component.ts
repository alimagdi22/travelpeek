import { Component, OnInit } from '@angular/core';

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
}

@Component({
  selector: 'app-my-trips',
  standalone: false,
  templateUrl: './my-trips.component.html',
  styleUrl: './my-trips.component.scss'
})
export class MyTripsComponent implements OnInit {
  messages: Message[] = [];
  newMessage: string = '';
  isTyping: boolean = false;
  suggestions: string[] = [
    'Add travel insurance',
    'Check visa requirements',
    'Window seat preference'
  ];

  ngOnInit() {
    this.initializeChat();
  }

  initializeChat() {
    this.messages = [
      {
        sender: 'user',
        text: 'I want to travel from Cairo to Dubai on 17 Aug.',
        timestamp: new Date()
      },
      {
        sender: 'system',
        text: 'Searching for the best flights from Cairo to Dubai on Aug 17... Found 3 great options for you.',
        timestamp: new Date(),
        flights: [
          {
            airline: 'Emirates',
            badge: 'FASTEST',
            badgeClass: 'badge-fastest',
            depTime: '14:00',
            depCode: 'CAI',
            arrTime: '18:30',
            arrCode: 'DXB',
            duration: '3h 38m',
            stops: 'NON-STOP',
            price: 'AED 1,240'
          },
          {
            airline: 'EgyptAir',
            badge: 'CHEAPEST',
            badgeClass: 'badge-cheapest',
            depTime: '09:15',
            depCode: 'CAI',
            arrTime: '14:00',
            arrCode: 'DXB',
            duration: '3h 45m',
            stops: 'NON-STOP',
            price: 'AED 890'
          }
        ]
      },
      {
        sender: 'user',
        text: "I'll go with the Emirates flight at 14:00.",
        timestamp: new Date()
      }
    ];
  }

  sendMessage(text: string) {
    if (!text.trim()) return;

    // Add user message
    this.messages.push({
      sender: 'user',
      text: text,
      timestamp: new Date()
    });

    this.newMessage = '';

    // Scroll to bottom
    this.scrollToBottom();

    // Trigger system response typing simulation
    this.isTyping = true;
    
    setTimeout(() => {
      this.isTyping = false;
      this.generateReply(text);
      this.scrollToBottom();
    }, 1500);
  }

  selectSuggestion(suggestion: string) {
    this.sendMessage(suggestion);
  }

  generateReply(userText: string) {
    let replyText = "I can help you with that! Is there anything else you'd like to customize or configure for your flight to Dubai?";
    
    const textLower = userText.toLowerCase();

    if (textLower.includes('insurance')) {
      replyText = "Done! I've added Travelpeek Premium Travel Insurance to your trip (covers medical emergencies up to $100,000, trip cancellations, and baggage delays for AED 95 per person).";
    } else if (textLower.includes('visa')) {
      replyText = "Egyptian passport holders require a pre-arranged tourist visa to enter Dubai. I can help process your UAE 30-day single-entry eVisa directly. Standard processing takes 48 hours for AED 350. Would you like to start the application?";
    } else if (textLower.includes('seat') || textLower.includes('window')) {
      replyText = "Perfect choice! I've requested a Window Seat in the forward cabin zone on your Emirates flight. Emirates seat selection is complimentary during online check-in, or we can pre-reserve it now for AED 40. Which do you prefer?";
    } else if (textLower.includes('emirates') || textLower.includes('cairo')) {
      replyText = "Excellent. I have held seat 24A on Emirates EK502 CAI-DXB for you. The total fare is AED 1,240. I will hold this seat price for the next 4 hours. You can click 'Book' or type 'confirm booking' to proceed.";
    }

    this.messages.push({
      sender: 'system',
      text: replyText,
      timestamp: new Date()
    });
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
