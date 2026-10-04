import { CanDeactivateFn } from '@angular/router';
import { MyTripsComponent } from '../my-trips.component';

export const leaveMyTripsGuard: CanDeactivateFn<MyTripsComponent> = (component) => {
  return component?.canLeavePage() ?? true;
};
