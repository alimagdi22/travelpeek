import { Component } from '@angular/core';

@Component({
  selector: 'app-hidden-gems-v2',
  standalone: false,
  templateUrl: './hidden-gems-v2.component.html',
  styleUrl: './hidden-gems-v2.component.scss'
})
export class HiddenGemsV2Component {
  gems = [
    {
      name: 'Cappadocia',
      tagline: 'High rating choice',
      icon: '⭐',
      image: '/assets/images/home/hidden-gems/cappadocia.png'
    },
    {
      name: 'Santorini',
      tagline: 'Cliff side views',
      icon: '🏖️',
      image: '/assets/images/home/hidden-gems/santorini.png'
    },
    {
      name: 'Kyoto',
      tagline: 'Historic district',
      icon: '🏮',
      image: '/assets/images/home/hidden-gems/kyoto.png'
    }
  ];
}
