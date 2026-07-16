import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private http = inject(HttpClient);
  conversationId: string | null = null;

  constructor() {}

  private userSubject = new BehaviorSubject<any>(null);
  private searchQuerySubject = new BehaviorSubject<string | null>(null);
  private selectedItinerarySubject = new BehaviorSubject<any>(null);
  private messageSubject = new Subject<any>();

  user$ = this.userSubject.asObservable();
  searchQuery$ = this.searchQuerySubject.asObservable();
  selectedItinerary$ = this.selectedItinerarySubject.asObservable();
  message$ = this.messageSubject.asObservable();

  travellersDetails: any = {
    contactDetails: null,
    travellers: {}
  };

  setUser(user: any) {
    this.userSubject.next(user);
  }

  setSearchQuery(query: string) {
    this.searchQuerySubject.next(query);
  }

  getSearchQuery(): string | null {
    return this.searchQuerySubject.getValue();
  }

  clearSearchQuery() {
    this.searchQuerySubject.next(null);
  }

  setSelectedItinerary(itinerary: any) {
    this.selectedItinerarySubject.next(itinerary);
  }

  getSelectedItinerary() {
    return this.selectedItinerarySubject.getValue();
  }

  private formatDateTime(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());

    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = pad(date.getMinutes());

    return `${yyyy}-${mm}-${dd} ${pad(hours)}:${minutes} ${ampm}`;
  }

  addMessage(message: any) {
    if (!message.timestamp) {
      message.timestamp = new Date();
    }
    this.messageSubject.next(message);

    if (this.conversationId) {
      const role = message.sender === 'user' ? 'User' : 'Assistant';
      let content = message.text || '';

      if (message.itineraries && message.itineraries.length > 0) {
        const flightLines = message.itineraries.slice(0, 5).map((itin: any, index: number) => {
          const airline = itin?.allJourney?.flights?.[0]?.flightDTO?.[0]?.flightAirline?.airlineName || 'Airline';
          const outbound = itin?.allJourney?.flights?.[0];
          const returnFlight = itin?.allJourney?.flights?.[1];
          const price = itin?.itinTotalFare?.amount ?? 0;
          const currency = itin?.itinTotalFare?.currencyCode ?? '';

          let outboundDesc = '';
          if (outbound) {
            const deptCode = outbound?.flightDTO?.[0]?.departureTerminalAirport?.airportCode || '';
            const segs = outbound?.flightDTO || [];
            const arrCode = segs.length > 0 ? (segs[segs.length - 1]?.arrivalTerminalAirport?.airportCode || '') : '';
            const deptDateStr = outbound?.flightDTO?.[0]?.departureDate || '';
            const arrDateStr = segs.length > 0 ? (segs[segs.length - 1]?.arrivalDate || '') : '';
            const deptTime = this.formatDateTime(deptDateStr);
            const arrTime = this.formatDateTime(arrDateStr);
            outboundDesc = `Outbound: ${deptCode} to ${arrCode} (${deptTime} - ${arrTime})`;
          }

          let returnDesc = '';
          if (returnFlight) {
            const deptCode = returnFlight?.flightDTO?.[0]?.departureTerminalAirport?.airportCode || '';
            const segs = returnFlight?.flightDTO || [];
            const arrCode = segs.length > 0 ? (segs[segs.length - 1]?.arrivalTerminalAirport?.airportCode || '') : '';
            const deptDateStr = returnFlight?.flightDTO?.[0]?.departureDate || '';
            const arrDateStr = segs.length > 0 ? (segs[segs.length - 1]?.arrivalDate || '') : '';
            const deptTime = this.formatDateTime(deptDateStr);
            const arrTime = this.formatDateTime(arrDateStr);
            returnDesc = `, Return: ${deptCode} to ${arrCode} (${deptTime} - ${arrTime})`;
          }

          return `${index + 1}. ${airline} - ${price} ${currency} (${outboundDesc}${returnDesc})`;
        });

        if (content) {
          content += '\n\nAvailable Flights:\n' + flightLines.join('\n');
        } else {
          content = 'Available Flights:\n' + flightLines.join('\n');
        }
      }

      this.saveMessage(this.conversationId, role, content).subscribe({
        error: (err) => console.error('Error saving message in addMessage:', err)
      });
    }
  }

  private toggleMobileHistorySubject = new Subject<boolean>();
  toggleMobileHistory$ = this.toggleMobileHistorySubject.asObservable();

  triggerToggleMobileHistory(open?: boolean) {
    this.toggleMobileHistorySubject.next(open ?? true);
  }

  private selectQuerySubject = new Subject<any>();
  selectQuery$ = this.selectQuerySubject.asObservable();

  triggerSelectQuery(query: any) {
    this.selectQuerySubject.next(query);
  }

  createConversation(title: string): Observable<any> {
    return this.http.post('http://154.41.209.93:9091/api/conversations', { title });
  }

  saveMessage(conversationId: string, role: string, content: string): Observable<any> {
    return this.http.post(`http://154.41.209.93:9091/api/conversations/${conversationId}/messages`, {
      role,
      content
    });
  }
}
