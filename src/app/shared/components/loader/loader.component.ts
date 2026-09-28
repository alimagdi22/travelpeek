import { NgStyle } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
  standalone: true,
  imports: [NgStyle],
})
export class LoaderComponent {
  @Input() text: string = '';
  @Input() color: string = '#004ac6';
  @Input() diameter: string = '50px';
}
