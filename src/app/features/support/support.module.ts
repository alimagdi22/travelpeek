import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SupportRoutingModule } from './support-routing.module';
import { SupportComponent } from './support.component';
import { SupportHeroComponent } from './components/support-hero/support-hero.component';
import { SupportSidebarComponent } from './components/support-sidebar/support-sidebar.component';
import { SupportTopicsComponent } from './components/support-topics/support-topics.component';
import { SupportFaqComponent } from './components/support-faq/support-faq.component';
import { SupportFooterBannerComponent } from './components/support-footer-banner/support-footer-banner.component';

@NgModule({
  declarations: [
    SupportComponent,
    SupportHeroComponent,
    SupportSidebarComponent,
    SupportTopicsComponent,
    SupportFaqComponent,
    SupportFooterBannerComponent,
  ],
  imports: [CommonModule, SupportRoutingModule],
})
export class SupportModule {}
