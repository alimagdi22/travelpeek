import { Component, Input } from '@angular/core';
import { IBaggageInformation } from 'rp-travel-ui';

@Component({
  standalone: false,
  selector: 'app-baggage-info',
  templateUrl: './baggage-info.component.html',
  styleUrl: './baggage-info.component.scss',
})
export class BaggageInfoComponent {
  @Input() baggages: IBaggageInformation[] | null = [];
}
