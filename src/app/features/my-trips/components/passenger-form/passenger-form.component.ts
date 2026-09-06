import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as countries from 'world-countries';

export interface PassengerFormData {
  gender: string;
  firstName: string;
  lastName: string;
  birthday: string;
  passportNumber: string;
  passportExpiry: string;
  issueCountry: string;
  formattedChatMessage: string;
}

@Component({
  selector: 'app-passenger-form',
  standalone: false,
  templateUrl: './passenger-form.component.html',
  styleUrls: ['./passenger-form.component.scss']
})
export class PassengerFormComponent implements OnInit {
  @Input() passengerLabel: string = 'Adult 1';
  @Input() passengerType: 'adult' | 'child' | 'infant' = 'adult';
  @Output() formSubmitted = new EventEmitter<PassengerFormData>();

  passengerForm!: FormGroup;
  isConfirming = false;
  hasSubmitted = false;

  countryList: string[] = [];
  filteredCountries: string[] = [];

  minBirthDateStr: string = '';
  maxBirthDateStr: string = '';
  minExpiryDateStr: string = '';

  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.initCountryList();
    this.initDateConstraints();

    this.passengerForm = this.fb.group({
      gender: ['Mr', Validators.required],
      firstName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]],
      lastName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]],
      birthDate: ['', Validators.required],
      passportNumber: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9]{4,15}$/)]],
      passportExpiry: ['', Validators.required],
      issueCountry: ['', [Validators.required, this.countryValidator.bind(this)]]
    });
  }

  initCountryList(): void {
    const rawList = countries.default.map((c: any) => c.name.common);
    this.countryList = rawList.sort();
    this.filteredCountries = [...this.countryList];
  }

  filterCountries(val: string): void {
    if (!val) {
      this.filteredCountries = [...this.countryList];
      return;
    }
    const filterVal = val.toLowerCase();
    this.filteredCountries = this.countryList.filter(c => c.toLowerCase().includes(filterVal));
  }

  countryValidator(control: any) {
    if (!control.value) return { required: true };
    const val = control.value.trim().toLowerCase();
    const exists = this.countryList.some(c => c.toLowerCase() === val);
    return exists ? null : { invalidCountry: true };
  }

  initDateConstraints(): void {
    const today = new Date();
    this.minExpiryDateStr = this.formatDateISO(today);

    if (this.passengerType === 'adult') {
      const minDate = new Date(today.getFullYear() - 100, 0, 1);
      const maxDate = new Date(today.getFullYear() - 12, 11, 31);
      this.minBirthDateStr = this.formatDateISO(minDate);
      this.maxBirthDateStr = this.formatDateISO(maxDate);
    } else if (this.passengerType === 'child') {
      const minDate = new Date(today.getFullYear() - 12, 0, 1);
      const maxDate = new Date(today.getFullYear() - 2, 11, 31);
      this.minBirthDateStr = this.formatDateISO(minDate);
      this.maxBirthDateStr = this.formatDateISO(maxDate);
    } else {
      const minDate = new Date(today.getFullYear() - 2, 0, 1);
      this.minBirthDateStr = this.formatDateISO(minDate);
      this.maxBirthDateStr = this.formatDateISO(today);
    }
  }

  formatDateISO(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  formatDateValue(val: string): string {
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      return `${day}/${month}/${year}`;
    }
    return val;
  }

  onNextClick(): void {
    this.passengerForm.markAllAsTouched();
    if (this.passengerForm.valid) {
      this.isConfirming = true;
    }
  }

  onEditClick(): void {
    this.isConfirming = false;
  }

  onFinalSubmit(): void {
    if (this.hasSubmitted) return;

    if (this.passengerForm.valid) {
      const { gender, firstName, lastName, birthDate, passportNumber, passportExpiry, issueCountry } = this.passengerForm.value;

      const formattedGender = (gender === 'Mr' || gender === 'male' || gender === 'Male') ? 'male' : 'female';
      const formattedBirthday = this.formatDateValue(birthDate);
      const formattedExpiry = this.formatDateValue(passportExpiry);
      const countryStr = String(issueCountry).trim();

      if (firstName && lastName && formattedBirthday && passportNumber && formattedExpiry && countryStr) {
        this.hasSubmitted = true;

        const formattedChatMessage = `my first name is ${firstName.trim()} my last name is ${lastName.trim()} , my gender is ${formattedGender} , my birthday is ${formattedBirthday} , my passport number is ${passportNumber.trim()} , passport expiry is ${formattedExpiry} , issue country is ${countryStr.toLowerCase()}`;

        this.formSubmitted.emit({
          gender: formattedGender,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          birthday: formattedBirthday,
          passportNumber: passportNumber.trim(),
          passportExpiry: formattedExpiry,
          issueCountry: countryStr,
          formattedChatMessage
        });
      }
    }
  }

  get formattedBirthdayDisplay(): string {
    return this.formatDateValue(this.passengerForm.get('birthDate')?.value);
  }

  get formattedExpiryDisplay(): string {
    return this.formatDateValue(this.passengerForm.get('passportExpiry')?.value);
  }

  isFieldInvalid(fieldName: string): boolean {
    const ctrl = this.passengerForm.get(fieldName);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}
