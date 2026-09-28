import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from 'rp-travel-ui';
import { CONFIRMATION_I18N } from './confirmation.translations';

@Component({
  standalone: false,
  selector: 'app-flight-confirmation',
  templateUrl: './flight-confirmation.component.html',
  styleUrl: './flight-confirmation.component.scss',
})
export class FlightConfirmationComponent implements OnInit {
  public confirmationService = inject(ConfirmationService);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);

  todayDate = new Date();

  ngOnInit(): void {
    this.translate.setTranslation('en', CONFIRMATION_I18N.en, true);
    this.translate.setTranslation('ar', CONFIRMATION_I18N.ar, true);
    if (!this.translate.currentLang) {
      this.translate.use('en');
    }

    if (this.route.snapshot.queryParamMap.has('sid') && this.route.snapshot.queryParamMap.has('HG')) {
      this.confirmationService.getConfirmationDate(
        this.route.snapshot.queryParamMap.get('sid') ?? '',
        this.route.snapshot.queryParamMap.get('HG') ?? '',
        this.route.snapshot.queryParamMap.get('tok') ?? '',
      );
    }
  }

  public get flights() {
    return this.confirmationService.confirmationData.airItineraries[0].allJourney.flights;
  }

  public get airItineraries() {
    return this.confirmationService.confirmationData.airItineraries[0];
  }
  public get passangers() {
    return this.confirmationService.confirmationData.passengersDetails;
  }
}
