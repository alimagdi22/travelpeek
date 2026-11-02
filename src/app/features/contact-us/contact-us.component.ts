import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { CONTACT } from '../../core/constants/contact';

@Component({
  selector: 'app-contact-us',
  standalone: false,
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.scss',
})
export class ContactUsComponent {
  private translate = inject(TranslateService);
  private sanitizer = inject(DomSanitizer);

  readonly contact = CONTACT;
  readonly mapUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(CONTACT.mapEmbed);

  firstName = '';
  lastName = '';
  phone = '';
  email = '';
  message = '';

  get isRtl(): boolean {
    return this.translate.currentLang === 'ar';
  }

  sendMessage(): void {
    const subject = encodeURIComponent(
      `${this.translate.instant('CONTACT.SEND')} - ${this.firstName} ${this.lastName}`.trim(),
    );
    const body = encodeURIComponent(
      [
        `${this.translate.instant('CONTACT.FIRST_NAME')}: ${this.firstName}`,
        `${this.translate.instant('CONTACT.LAST_NAME')}: ${this.lastName}`,
        `${this.translate.instant('CONTACT.PHONE')}: ${this.phone}`,
        `${this.translate.instant('CONTACT.EMAIL')}: ${this.email}`,
        '',
        this.message,
      ].join('\n'),
    );
    window.location.href = `mailto:${this.contact.email}?subject=${subject}&body=${body}`;
  }
}
