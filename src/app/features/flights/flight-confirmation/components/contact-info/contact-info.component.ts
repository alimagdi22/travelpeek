import { Component, inject, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PassengersDetailsEntity } from 'rp-travel-ui';

@Component({
  standalone: false,
  selector: 'app-contact-info',
  templateUrl: './contact-info.component.html',
  styleUrl: './contact-info.component.scss',
})
export class ContactInfoComponent {
  @Input() passenger: PassengersDetailsEntity = {
    title: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    countryOfResidence: '',
    nationality: '',
    issuedCountry: '',
    countryCode: '',
    phoneNumber: '',
    passportNumber: '',
    passportExpiry: '',
    passengerType: '',
    ticketNumber: null,
  };

  @Input() email = '';

  translate = inject(TranslateService);
}
