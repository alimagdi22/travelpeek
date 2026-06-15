import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  constructor() {}

  private userSubject = new BehaviorSubject<any>(null);
  private searchQuerySubject = new BehaviorSubject<string | null>(null);

  user$ = this.userSubject.asObservable();
  searchQuery$ = this.searchQuerySubject.asObservable();

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
}
