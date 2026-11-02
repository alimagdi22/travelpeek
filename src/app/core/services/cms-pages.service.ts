import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { catchError, concatMap, first, from, map, Observable, of } from 'rxjs';
import { envRP } from '../enviroments/roundpixel.env';

export interface CmsPageContents {
  en: string;
  ar: string;
}

@Injectable({ providedIn: 'root' })
export class CmsPagesService {
  private http = inject(HttpClient);
  private translate = inject(TranslateService);

  getPageContents(slugs: string | string[]): Observable<CmsPageContents | null> {
    const list = Array.isArray(slugs) ? slugs : [slugs];
    return from(list).pipe(
      concatMap((slug) => this.fetchSlug(slug)),
      first((contents): contents is CmsPageContents => !!contents, null),
    );
  }

  pickLang(contents: CmsPageContents | null): string {
    if (!contents) {
      return '';
    }
    const lang = this.translate.currentLang || this.translate.defaultLang || 'en';
    return lang === 'ar' ? contents.ar || contents.en : contents.en || contents.ar;
  }

  private fetchSlug(slug: string): Observable<CmsPageContents | null> {
    const api = `${envRP.staticPages}/api/Pages/GetPageBySlug?slug=${encodeURIComponent(slug)}`;
    return this.http.get<unknown>(api).pipe(
      map((res) => this.extractContents(res)),
      catchError(() => of(null)),
    );
  }

  private extractContents(res: unknown): CmsPageContents | null {
    if (!res || typeof res !== 'object') {
      return null;
    }

    const response = res as Record<string, unknown>;
    if (response['status'] !== undefined && Number(response['status']) !== 0) {
      return null;
    }

    const nested = response['returnObject'] ?? response['data'] ?? response;
    const obj = nested && typeof nested === 'object' ? (nested as Record<string, unknown>) : {};
    const en = this.readText(obj, ['content', 'Content']);
    const ar = this.readText(obj, ['contentArabic', 'ContentArabic']);

    if (!en && !ar) {
      return null;
    }

    return { en, ar };
  }

  private readText(obj: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = obj[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return '';
  }
}
