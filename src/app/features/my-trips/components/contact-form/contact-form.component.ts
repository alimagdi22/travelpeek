import { Component, EventEmitter, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CountryISO, SearchCountryField } from 'ngx-intl-tel-input-gg';

@Component({
  selector: 'app-contact-form',
  standalone: false,
  templateUrl: './contact-form.component.html',
  styleUrls: ['./contact-form.component.scss']
})
export class ContactFormComponent implements OnInit, OnDestroy {
  @Output() formSubmitted = new EventEmitter<{ email: string; phone: string }>();

  contactForm!: FormGroup;
  hasSubmitted = false;
  private debounceTimer: any = null;

  CountryISO = CountryISO;
  SearchCountryField = SearchCountryField;
  preferredCountries: CountryISO[] = [
    CountryISO.Egypt,
    CountryISO.SaudiArabia,
    CountryISO.UnitedArabEmirates,
    CountryISO.UnitedKingdom,
    CountryISO.UnitedStates
  ];

  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      phone: ['', [Validators.required, this.phoneValidator]]
    });

    this.contactForm.valueChanges.subscribe(() => {
      this.checkAndSubmitWithDebounce();
    });
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  phoneValidator(control: any) {
    if (!control.value) {
      return { required: true };
    }
    if (typeof control.value === 'object' && control.value !== null) {
      const num = control.value.number || '';
      if (!num || String(num).trim().length < 5) {
        return { invalidPhone: true };
      }
      return null;
    }
    if (typeof control.value === 'string') {
      const str = control.value.trim();
      if (!/^[\d\+\-\s\(\)]{5,20}$/.test(str)) {
        return { invalidPhone: true };
      }
      return null;
    }
    return null;
  }

  checkAndSubmitWithDebounce(): void {
    if (this.hasSubmitted) return;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.contactForm.valid) {
      // Wait 1 second (1000ms) after user stops typing to give time to finish (e.g. .com instead of .co)
      this.debounceTimer = setTimeout(() => {
        if (this.contactForm.valid && !this.hasSubmitted) {
          const { email, phone } = this.contactForm.value;
          let phoneStr = '';
          if (typeof phone === 'object' && phone !== null) {
            phoneStr = phone.e164Number || phone.internationalNumber || phone.number || '';
          } else if (typeof phone === 'string') {
            phoneStr = phone;
          }

          if (email && phoneStr) {
            this.hasSubmitted = true;
            this.formSubmitted.emit({
              email: email.trim(),
              phone: phoneStr.trim()
            });
          }
        }
      }, 1000);
    }
  }

  get isEmailInvalid(): boolean {
    const ctrl = this.contactForm.get('email');
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  get isPhoneInvalid(): boolean {
    const ctrl = this.contactForm.get('phone');
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}
