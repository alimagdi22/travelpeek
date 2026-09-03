import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
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
export class PassengerFormComponent implements OnInit, OnDestroy {
  @Input() passengerLabel: string = 'Adult 1';
  @Input() passengerType: 'adult' | 'child' | 'infant' = 'adult';
  @Output() formSubmitted = new EventEmitter<PassengerFormData>();

  passengerForm!: FormGroup;
  hasSubmitted = false;
  private debounceTimer: any = null;

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

    this.passengerForm.valueChanges.subscribe(() => {
      this.checkAndSubmitWithDebounce();
    });
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
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

  checkAndSubmitWithDebounce(): void {
    if (this.hasSubmitted) return;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.passengerForm.valid) {
      // Wait 1 second (1000ms) after user stops typing to give time to finish
      this.debounceTimer = setTimeout(() => {
        if (this.passengerForm.valid && !this.hasSubmitted) {
          const { gender, firstName, lastName, birthDate, passportNumber, passportExpiry, issueCountry } = this.passengerForm.value;

          const formattedGender = (gender === 'Mr' || gender === 'male' || gender === 'Male') ? 'male' : 'female';
          const formattedBirthday = this.formatDateValue(birthDate);
          const formattedExpiry = this.formatDateValue(passportExpiry);
          const countryStr = String(issueCountry).trim();

          if (firstName && lastName && formattedBirthday && passportNumber && formattedExpiry && countryStr) {
            this.hasSubmitted = true;

            // Formatted chat message string required by prompt:
            // "my first name is ali my last name is magdi , my gender is male , my birthday is 1/9/1998 , my passport number is 1238486 , passport expiry is 1/8/2027 , issue country is egypt"
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
      }, 1000);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const ctrl = this.passengerForm.get(fieldName);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}
