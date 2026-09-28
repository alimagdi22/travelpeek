import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-confirmation-header',
  templateUrl: './confirmation-header.component.html',
  styleUrl: './confirmation-header.component.scss',
})
export class ConfirmationHeaderComponent implements OnInit {
  hgNumber!: string;
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.hgNumber = this.route.snapshot.queryParamMap.get('HG')!;
  }
  onPrintTicket(): void {
    window.print();
  }
}
