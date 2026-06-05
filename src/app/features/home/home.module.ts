import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { CuratedGemsComponent } from './components/curated-gems/curated-gems.component';
import { BeachEscapesComponent } from './components/beach-escapes/beach-escapes.component';
import { AsiaBannerComponent } from './components/asia-banner/asia-banner.component';
import { NewsletterComponent } from './components/newsletter/newsletter.component';

// New V2 / Extra Components
import { CuratedForYouV2Component } from './components/curated-for-you-v2/curated-for-you-v2.component';
import { HiddenGemsV2Component } from './components/hidden-gems-v2/hidden-gems-v2.component';
import { BeachEscapesV2Component } from './components/beach-escapes-v2/beach-escapes-v2.component';
import { NewsletterV2Component } from './components/newsletter-v2/newsletter-v2.component';
import { FeatureCardsComponent } from './components/feature-cards/feature-cards.component';

@NgModule({
  declarations: [
    HomeComponent,
    HeroSectionComponent,
    CuratedGemsComponent,
    BeachEscapesComponent,
    AsiaBannerComponent,
    NewsletterComponent,
    // V2 declarations
    CuratedForYouV2Component,
    HiddenGemsV2Component,
    BeachEscapesV2Component,
    NewsletterV2Component,
    FeatureCardsComponent
  ],
  imports: [CommonModule, HomeRoutingModule],
})
export class HomeModule {}

