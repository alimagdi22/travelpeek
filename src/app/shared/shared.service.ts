import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  constructor() {}

  private userSubject = new BehaviorSubject<any>(null);
  private searchQuerySubject = new BehaviorSubject<string | null>(null);
  private selectedItinerarySubject = new BehaviorSubject<any>(null);
  private messageSubject = new Subject<any>();

  user$ = this.userSubject.asObservable();
  searchQuery$ = this.searchQuerySubject.asObservable();
  selectedItinerary$ = this.selectedItinerarySubject.asObservable();
  message$ = this.messageSubject.asObservable();

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

  addMessage(message: any) {
    if (!message.timestamp) {
      message.timestamp = new Date();
    }
    this.messageSubject.next(message);
  }
}
