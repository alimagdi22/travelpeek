import { IAirItinerary } from "rp-travel-ui";

export interface Message {
  sender: 'user' | 'system';
  text: string;
  timestamp: Date;
  flights?: FlightCard[];
  itineraries?: IAirItinerary[];
  recommendedItineraries?: IAirItinerary[];
  isFlightSelection?: boolean;
  showBookingPrompt?: boolean;
  passengerCountLabel?: string;
  isPayment?: boolean;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentImg?: string;
  paymentMethod?: string;
  gateways?: any[];
  isAnimating?: boolean;
  showContactForm?: boolean;
  showPassengerForm?: boolean;
  passengerLabel?: string;
  passengerType?: 'adult' | 'child' | 'infant';
  passengerFormPrefill?: {
    gender?: string;
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    passportNumber?: string;
    passportExpiry?: string;
    issueCountry?: string;
  };
  showPassportReview?: boolean;
  passportTraveler?: Record<string, string | null>;
  actionsDisabled?: boolean;
}


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
