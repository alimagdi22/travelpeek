import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-smart-assistant-sidebar',
  standalone: false,
  templateUrl: './smart-assistant-sidebar.component.html',
  styleUrl: './smart-assistant-sidebar.component.scss'
})
export class SmartAssistantSidebarComponent implements OnInit {
  isSidebarCollapsed: boolean = false;

  ngOnInit(): void {}

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}
