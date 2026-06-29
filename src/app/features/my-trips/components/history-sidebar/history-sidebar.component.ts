import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-history-sidebar',
  standalone: false,
  templateUrl: './history-sidebar.component.html',
  styleUrl: './history-sidebar.component.scss'
})
export class HistorySidebarComponent {
  @Input() searchHistory: string[] = [];
  @Input() isLoggedIn: boolean = false;
  @Input() userInitials: string = '';
  @Input() userDisplayName: string = '';
  @Input() isMobileHistoryOpen: boolean = false;

  @Output() querySelected = new EventEmitter<string>();
  @Output() clearHistory = new EventEmitter<void>();
  @Output() newChatTriggered = new EventEmitter<void>();
  @Output() closeMobileDrawer = new EventEmitter<void>();

  isSidebarCollapsed: boolean = false;

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  onSelectQuery(query: string) {
    this.querySelected.emit(query);
    this.closeMobileDrawer.emit();
  }

  onClear() {
    this.clearHistory.emit();
  }

  onNewChat() {
    this.newChatTriggered.emit();
    this.closeMobileDrawer.emit();
  }
}
