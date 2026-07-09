import { Component, Input, Output, EventEmitter, inject, OnInit, OnDestroy } from '@angular/core';
import { FlightResultService } from 'rp-travel-ui';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-history-sidebar',
  standalone: false,
  templateUrl: './history-sidebar.component.html',
  styleUrl: './history-sidebar.component.scss'
})
export class HistorySidebarComponent implements OnInit , OnDestroy {
  @Input() searchHistory: any[] = [];
  @Input() isLoggedIn: boolean = false;
  @Input() userInitials: string = '';
  @Input() userDisplayName: string = '';
  @Input() isMobileHistoryOpen: boolean = false;

  @Output() querySelected = new EventEmitter<any>();
  @Output() clearHistory = new EventEmitter<void>();
  @Output() newChatTriggered = new EventEmitter<void>();
  @Output() closeMobileDrawer = new EventEmitter<void>();

  subscription = new Subscription;
  flightResultService = inject(FlightResultService)
  isSidebarCollapsed: boolean = false;

  ngOnInit(): void {
  }
  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  onSelectQuery(item: any) {
    this.querySelected.emit(item);
    this.closeMobileDrawer.emit();
  }

  onClear() {
    this.clearHistory.emit();
  }

  onNewChat() {
    this.newChatTriggered.emit();
    this.closeMobileDrawer.emit();
  }

  ngOnDestroy(): void {
      this.subscription.unsubscribe()
  }
}
