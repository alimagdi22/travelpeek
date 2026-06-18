import { animate, style, transition, trigger } from '@angular/animations';
import { Component } from '@angular/core';

@Component({
  selector: 'app-side-nav-content',
  templateUrl: './side-nav-content.component.html',
  styleUrls: ['./side-nav-content.component.scss'],
  standalone: false,
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [style({ opacity: 0 }), animate('150ms ease-in', style({ opacity: 1 }))]),
      transition(':leave', [animate('150ms ease-out', style({ opacity: 0 }))]),
    ]),
  ],
})
export class SideNavContentComponent {
  alertTrigger = false;
}
