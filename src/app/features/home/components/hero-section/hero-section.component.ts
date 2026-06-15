import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SharedService } from '../../../../shared/shared.service';

@Component({
  selector: 'app-hero-section',
  standalone: false,
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.scss',
})
export class HeroSectionComponent {
  router = inject(Router);
  sharedService = inject(SharedService);
  searchQuery: string = '';

  performSearch(query?: string) {
    const q = query || this.searchQuery;
    if (!q || !q.trim()) return;

    this.sharedService.setSearchQuery(q.trim());
    this.router.navigate(['/my-trips']);
  }
}
