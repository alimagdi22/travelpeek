import { Component, inject, OnInit, OnDestroy, DestroyRef } from '@angular/core';
import { FlightResultService, IAirItinerary, IFlight, UserProfileService, FlightCheckoutApiService, FlightCheckoutService } from 'rp-travel-ui';
import { SharedService } from '../../shared/shared.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { DatePipe } from '@angular/common';
import { Message } from '../../core/models/message.interface';
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
  private subscription = new Subscription();
  private filterFormSub: Subscription | null = null;
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
          this.handleFlightSelection(itinerary);
        }
      }),
    );

    // Listen to messages pushed from shared service
    this.subscription.add(
      this.sharedService.message$.subscribe((msg) => {
        if (msg) {
          if (msg.sender === 'system') {
            msg.isAnimating = true;
          }
          this.messages.push(msg);
          this.scrollToBottom();
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
          const lastMsg = this.messages[this.messages.length - 1];
          if (lastMsg.sender === 'system' && lastMsg.itineraries) {
            lastMsg.itineraries = this.getFilteredItineraries();
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

    const query = this.sharedService.getSearchQuery();
    if (query) {
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

  ngOnDestroy() {
    this.subscription.unsubscribe();
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
          this.messages = response.data.items.map((msgItem: any) => ({
            sender: msgItem.role === 'User' ? 'user' : 'system',
            text: msgItem.content,
            timestamp: new Date(msgItem.createdAt)
          }));
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
    this.generateChatId();
    this.flightResultService.response = undefined;
    this.flightResultService.responseAi = undefined;
    this.flightResultService.bookResponseAi = undefined; // Clear booking response
    this.flightResultService.ResultFound = false;
    this.flightResultService.normalError = '';
    this.resetCheckoutState();
    if (this.filterFormSub) {
      this.filterFormSub.unsubscribe();
      this.filterFormSub = null;
    }
    this.initializeChat();
  }

  initializeChat() {
    this.messages = [
      {
        sender: 'system',
        text: 'Hello! I am your AI travel assistant. Where would you like to travel today?',
        timestamp: new Date(),
        isAnimating: true,
      },
    ];
  }

  async sendMessage(text: string) {
    if (!text.trim()) return;

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

    try {
      let conversationId = this.sharedService.conversationId;
      if (!conversationId) {
        // First message: Create conversation first
        const createRes = await firstValueFrom(this.sharedService.createConversation(text));
        if (createRes && createRes.success && createRes.data?.conversationId) {
          const newId: string = createRes.data.conversationId;
          this.sharedService.conversationId = newId;
          this.chatID = newId;

          // Refresh search history list
          this.flightResultService.getSearchHistory();

          // Save the fixed initial greeting message first
          try {
            await firstValueFrom(
              this.sharedService.saveMessage(newId, 'Assistant', 'Hello! I am your AI travel assistant. Where would you like to travel today?')
            );
          } catch (e) {
            console.error('Error saving greeting:', e);
          }

          // Save the user's first message
          try {
            await firstValueFrom(
              this.sharedService.saveMessage(newId, 'User', text)
            );
          } catch (e) {
            console.error('Error saving first user message:', e);
          }
        }
      }
    } catch (err) {
      console.error('Error saving conversation/message:', err);
    }

    if (this.isEnteringContactDetails) {
      // ── Contact Details Flow ──
      this.flightResultService.getContactDetails({
        chat: text,
        chatID: this.chatID,
      });

      const checkInterval = setInterval(() => {
        if (!this.flightResultService.loading) {
          clearInterval(checkInterval);
          this.isTyping = false;

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

                this.sharedService.addMessage({
                  sender: 'system',
                  text: transitionMessage,
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
                this.scrollToBottom();

                const currency = this.selectedItinerary?.itinTotalFare?.currencyCode || 'AED';

                // Initialize selectedFlight for flightCheckoutService
                this.flightCheckoutService.selectedFlight = {
                  searchCriteria: this.flightResultService.response?.searchCriteria || this.flightResultService.responseAi?.searchCriteria!,
                  airItineraryDTO: this.selectedItinerary!
                } as any;

                this.flightCheckoutServiceApi.addPaymentGateways(currency, 'EG', this.selectedItinerary!).subscribe({
                  next: (gateways) => {
                    this.flightResultService.loading = false;
                    this.sharedService.addMessage({
                      sender: 'system',
                      text: '',
                      isPayment: true,
                      itineraries: this.selectedItinerary ? [this.selectedItinerary] : undefined,
                      paymentAmount: this.selectedItinerary?.itinTotalFare?.amount || 1240,
                      paymentCurrency: currency,
                      gateways: gateways // Pass the gateways array to the component
                    });
                    this.scrollToBottom();
                  },
                  error: (err) => {
                    this.flightResultService.loading = false;
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
      this.flightResultService.getDataFromAiUrl({
        chat: text,
        chatID: this.chatID,
      });

      const checkInterval = setInterval(() => {
        if (!this.flightResultService.loading) {
          clearInterval(checkInterval);
          this.isTyping = false;

          let replyText = '';
          const response = this.flightResultService.response;
          const responseAi = this.flightResultService.responseAi;

          if (responseAi && responseAi.output) {
            replyText = responseAi.output;
          } else if (!this.flightResultService.ResultFound || (!response && !responseAi)) {
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
          } else {
            replyText = `Found flights matching your search: "${text}".`;
          }

          const resultFound = this.flightResultService.ResultFound;
          const airItineraries = this.getFilteredItineraries();

          this.sharedService.addMessage({
            sender: 'system',
            text: replyText,
            itineraries:
              resultFound && airItineraries.length > 0 ? airItineraries : undefined,
          });

          if (resultFound && airItineraries && airItineraries.length > 0) {
            this.scrollToLastSystemMessage();
          } else {
            this.scrollToBottom();
          }
        }
      }, 200);
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
      this.sendMessage(this.newMessage);
    }
  }

  adjustTextareaHeight(textarea: any) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  handleFlightSelection(itinerary: IAirItinerary) {
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

    // 3. Prompt for contact details in a separate message
    const promptText = `Please provide contact details, phone and email.`;
    this.sharedService.addMessage({
      sender: 'system',
      text: promptText,
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
      setTimeout(() => {
        this.isTyping = false;
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
          paymentAmount: this.selectedItinerary?.itinTotalFare?.amount || 1240,
          paymentCurrency:
            this.selectedItinerary?.itinTotalFare?.currencyCode || 'AED',
        });
      }, 1500);
    }
  }

  enterNamesManually() {
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
    this.isEnteringNamesManually = true; // Switch context to booking flow

    setTimeout(() => {
      this.isTyping = false;
      const currentPassenger = this.passengerList[this.currentPassengerIndex] || this.passengerList[0];
      const targetPassengerLabel = currentPassenger
        ? this.getPassengerLabel(currentPassenger)
        : (this.getPassengersCountLabel().toLowerCase() || 'passenger');
      const promptText = `I need a few more details. Could you provide the first name, last name, gender, birthdate , passport number, passport expiry date and issue country or upload a passport copy of ${targetPassengerLabel}?`;

      this.sharedService.addMessage({
        sender: 'system',
        text: promptText,
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
    if (this.flightResultService.orgnizedResponce && this.flightResultService.orgnizedResponce.length > 0) {
      return this.flightResultService.orgnizedResponce.map(group => group[0]).slice(0, 5);
    }
    return [];
  }

  get hasFlightResults(): boolean {
    return !!(
      this.flightResultService.ResultFound &&
      !this.flightResultService.loading &&
      (
        this.flightResultService.response?.airItineraries?.length ||
        this.flightResultService.responseAi?.airItineraries?.length ||
        this.flightResultService.responseAi?.itineraries?.length ||
        (this.flightResultService.orgnizedResponce && this.flightResultService.orgnizedResponce.length > 0)
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

  openStopsModal(itinerary: IAirItinerary, legIndex: number) {
    this.selectedItineraryForStops = itinerary;
    this.selectedStopsIndex = legIndex;
    this.showStopsModal = true;
  }

  closeStopsModal() {
    this.showStopsModal = false;
  }

  getActiveLeg(): IFlight | null {
    if (!this.selectedItineraryForStops) return null;
    const flights = this.selectedItineraryForStops.allJourney?.flights;
    return flights && flights.length > this.selectedStopsIndex ? flights[this.selectedStopsIndex] : null;
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

  subscribeToFilterChanges() {
    if (this.filterFormSub) {
      this.filterFormSub.unsubscribe();
    }
    if (!this.flightResultService.filterForm) return;

    this.filterFormSub = this.flightResultService.filterForm.valueChanges.subscribe(() => {
      setTimeout(() => {
        if (this.messages.length > 0) {
          const lastMsg = this.messages[this.messages.length - 1];
          if (lastMsg.sender === 'system' && lastMsg.itineraries) {
            lastMsg.itineraries = this.getFilteredItineraries();
          }
        }
      }, 50);
    });
    this.subscription.add(this.filterFormSub);
  }
}
