import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { CmsPageContents, CmsPagesService } from '../../../../core/services/cms-pages.service';

@Component({
  selector: 'app-user-agreement',
  standalone: false,
  templateUrl: './agreement.component.html',
  styleUrl: './agreement.component.scss',
})
export class AgreementComponent implements OnInit, OnDestroy {
  private cms = inject(CmsPagesService);
  private translate = inject(TranslateService);
  private subscription = new Subscription();
  private contents: CmsPageContents | null = null;

  cmsHtml = '';

  ngOnInit(): void {
    this.subscription.add(
      this.cms.getPageContents(['user-agreement', 'agreement']).subscribe((contents) => {
        this.contents = contents;
        this.syncHtml();
      }),
    );
    this.subscription.add(this.translate.onLangChange.subscribe(() => this.syncHtml()));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private syncHtml(): void {
    this.cmsHtml = this.cms.pickLang(this.contents);
  }
}
