import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LegalComponent } from './legal.component';
import { TermsComponent } from './components/terms/terms.component';
import { PrivacyComponent } from './components/privacy/privacy.component';
import { CookiesComponent } from './components/cookies/cookies.component';
import { AgreementComponent } from './components/agreement/agreement.component';

const routes: Routes = [
  {
    path: '',
    component: LegalComponent,
    children: [
      { path: '', redirectTo: 'terms-of-service', pathMatch: 'full' },
      { path: 'terms-of-service', component: TermsComponent },
      { path: 'privacy-policy', component: PrivacyComponent },
      { path: 'cookie-policy', component: CookiesComponent },
      { path: 'user-agreement', component: AgreementComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LegalRoutingModule {}
