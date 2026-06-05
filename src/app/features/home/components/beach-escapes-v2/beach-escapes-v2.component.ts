import { Component } from '@angular/core';

@Component({
  selector: 'app-beach-escapes-v2',
  standalone: false,
  templateUrl: './beach-escapes-v2.component.html',
  styleUrl: './beach-escapes-v2.component.scss'
})
export class BeachEscapesV2Component {
  escapes = [
    {
      name: 'Maldives',
      description: 'Crystal clear waters and private villas.',
      price: 'AED 3,450',
      image: '/assets/images/home/beach-escapes/maldives.png'
    },
    {
      name: 'Seychelles',
      description: 'Untouched nature and white sands.',
      price: 'AED 2,090',
      image: '/assets/images/home/beach-escapes/Seychelles.png'
    }
  ];
}
