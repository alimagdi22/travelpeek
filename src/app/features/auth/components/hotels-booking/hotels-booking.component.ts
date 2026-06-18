import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ICardModel, TripsService } from 'rp-travel-ui';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-hotels-booking',
  templateUrl: './hotels-booking.component.html',
  styleUrl: './hotels-booking.component.scss',
  standalone: false,
})
export class HotelsBookingComponent implements OnInit, OnDestroy {
  tripsService = inject(TripsService);
  subscription = new Subscription();

  allTrips: ICardModel[] = [];
  trips: ICardModel[] = [];

  pageSize = 5;

  ngOnInit(): void {
    if (this.tripsService.allTrips.historyFlights.length) {
      this.allTrips = this.tripsService.getFlightDetails(this.tripsService.allTrips.historyFlights);
      this.trips = this.allTrips.slice(0, this.pageSize);
    }

    this.subscription.add(
      this.tripsService.notify.subscribe({
        next: (val) => {
          if (val) {
          } else {
            this.allTrips = this.tripsService.getFlightDetails(this.tripsService.allTrips.historyFlights);
            this.trips = this.allTrips.slice(0, this.pageSize);
          }
        },
      })
    );
  }

  onPaginate(currentPage: any) {
    const startIndex = (currentPage - 1) * this.pageSize;
    const lastIndex = startIndex + this.pageSize - 1;

    this.trips = this.allTrips.slice(startIndex, lastIndex);
  }

  get isLoading() {
    return this.tripsService.isLoading;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
