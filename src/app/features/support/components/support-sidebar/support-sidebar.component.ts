import { isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { whatsappUrl } from '../../../../core/constants/contact';

@Component({
  selector: 'app-support-sidebar',
  standalone: false,
  templateUrl: './support-sidebar.component.html',
  styleUrl: './support-sidebar.component.scss',
})
export class SupportSidebarComponent {
  private translate = inject(TranslateService);
  private platformId = inject(PLATFORM_ID);

  openWhatsApp(topicKey: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const topic = this.translate.instant(topicKey);
    window.open(whatsappUrl(topic), '_blank', 'noopener');
  }
}
