import { Component } from '@angular/core';

@Component({
  selector: 'app-curated-gems',
  standalone: false,
  templateUrl: './curated-gems.component.html',
  styleUrl: './curated-gems.component.scss',
})
export class CuratedGemsComponent {
  filters = ['All', 'Nature', 'City Breaks', 'Family Friendly', 'Luxury'];
  activeFilter = 'All';

  setActiveFilter(filter: string) {
    this.activeFilter = filter;
  }
}
