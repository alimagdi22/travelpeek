import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { CmsPageContents, CmsPagesService } from '../../../../core/services/cms-pages.service';

@Component({
  selector: 'app-privacy-policy',
  standalone: false,
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss',
})
export class PrivacyComponent implements OnInit, OnDestroy {
  private cms = inject(CmsPagesService);
  private translate = inject(TranslateService);
  private subscription = new Subscription();
  private contents: CmsPageContents | null = null;

  cmsHtml = '';

  ngOnInit(): void {
    this.subscription.add(
      this.cms.getPageContents('privacy-policy').subscribe((contents) => {
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
