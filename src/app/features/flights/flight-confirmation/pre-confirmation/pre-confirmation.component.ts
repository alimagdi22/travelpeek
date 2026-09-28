import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from 'rp-travel-ui';
import { Subscription } from 'rxjs';
import { CONFIRMATION_I18N } from '../confirmation.translations';

export interface paymentinfo {
  paymentMethod: string;
  paymentRef: string;
  paymentTrackID: string;
  amount: number;
  currency: string;
  hg: string;
}

@Component({
  standalone: false,
  selector: 'app-pre-confirmation',
  templateUrl: './pre-confirmation.component.html',
  styleUrls: ['./pre-confirmation.component.scss'],
})
export class PreConfirmationComponent implements OnInit, OnDestroy {
  url: string = '';
  Loading: boolean = true;
  Failed: boolean = false;
  searchId: string = '';
  HGNum: string = '';
  token: string = '';
  posturl: string = '';
  result: any;
  src: string = '';
  paymentError: string =
    "Something went wrong during payment. But don't worry — our customer service will help you complete your booking.";
  paymentErrorStatus: boolean = false;
  paymentinfo!: paymentinfo;
  myDate = new Date();
  amount: number = 0;
  currency: string = '';
  public confirmation = inject(ConfirmationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private subscription: Subscription = new Subscription();

  ngOnInit(): void {
    this.translate.setTranslation('en', CONFIRMATION_I18N.en, true);
    this.translate.setTranslation('ar', CONFIRMATION_I18N.ar, true);
    if (!this.translate.currentLang) {
      this.translate.use('en');
    }

    const queryParams = { ...this.route.snapshot.queryParams };

    this.searchId = this.route.snapshot.queryParamMap.get('sid') || '';
    this.HGNum = this.route.snapshot.queryParamMap.get('HG') || '';
    this.token = this.route.snapshot.queryParamMap.get('tok') || '';
    this.src = this.route.snapshot.queryParamMap.get('sc') || '';
    this.url = this.router.url;
    const trandata = queryParams['trandata'];
    const errorText = queryParams['errorText'];

    if (trandata) {
      const knetData = {
        errorText: errorText || '',
        trandata: trandata,
      };

      delete queryParams['trandata'];
      delete queryParams['errorText'];

      queryParams['knet_data'] = JSON.stringify(knetData);
    }

    const queryString = new URLSearchParams(queryParams).toString();
    this.url = queryString;
    this.subscription.add(
      this.confirmation.api.getPaymentResult(this.url).subscribe(
        (result) => {
          this.result = result;
          this.amount = this.result.PaymentFareDetails.TotalAmount;
          this.currency = this.result.PaymentFareDetails.CustomerPaymentCurrency;
          if (this.result.Status == 0) {
            this.posturl = this.result.paymentResult.PostPayment;
            let theToken = this.result.HGToken;
            this.subscription.add(
              this.confirmation.api.PostProcessing(theToken, this.posturl).subscribe(
                (result) => {
                  if (result.status == 0 && this.src != 'mob') {
                    this.router.navigate(['/paymentresult/flightConfirmation'], {
                      queryParams: { sid: this.searchId, HG: this.HGNum, tok: theToken },
                    });
                  } else {
                    this.paymentErrorStatus = true;
                    this.Loading = false;
                    this.paymentinfo = {
                      paymentMethod: result.paymentMethod ? result.paymentMethod : 'knet',
                      paymentRef: result.paymentRef,
                      paymentTrackID: result.paymentTrackID,
                      amount: this.amount,
                      currency: this.currency,
                      hg: this.HGNum,
                    };
                  }
                },
                () => {
                  this.paymentErrorStatus = true;
                  this.Loading = false;
                },
              ),
            );
          } else {
            this.paymentErrorStatus = true;
          }
        },
        (error) => {
          this.paymentErrorStatus = true;
          this.Loading = false;
          console.error('get payment result error', error);
        },
      ),
    );
  }
  NavigateToHome() {
    this.router.navigate(['/']);
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
