import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-tickets',
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss'],
  standalone: false,
})
export class TicketsComponent {
  @Input() tickets: any[] = [];
  @Output() clickCancel = new EventEmitter<null>();

  onClickCancel() {
    this.clickCancel.emit(null);
  }
}
