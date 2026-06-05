import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LegalRoutingModule } from './legal-routing.module';
import { LegalComponent } from './legal.component';
import { TermsComponent } from './components/terms/terms.component';
import { PrivacyComponent } from './components/privacy/privacy.component';
import { CookiesComponent } from './components/cookies/cookies.component';
import { AgreementComponent } from './components/agreement/agreement.component';

@NgModule({
  declarations: [
    LegalComponent,
    TermsComponent,
    PrivacyComponent,
    CookiesComponent,
    AgreementComponent,
  ],
  imports: [CommonModule, LegalRoutingModule],
})
export class LegalModule {}
