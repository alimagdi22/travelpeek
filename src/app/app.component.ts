import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SharedModule } from './shared/shared.module';
import { EnvironmentService } from 'rp-travel-ui';
import { envRP } from './core/enviroments/roundpixel.env';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SharedModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'travelpeek';
  environmentService = inject(EnvironmentService);
  ngOnInit(): void {
    this.environmentService.envConfiguration(envRP);
  }
}
