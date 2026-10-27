import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

export type AppLanguage = 'en' | 'ar';

export interface LanguageOption {
  code: AppLanguage;
  short: string;
  label: string;
  nativeLabel: string;
  dir: 'ltr' | 'rtl';
}

const STORAGE_KEY = 'lang';
const DEFAULT_LANG: AppLanguage = 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translate = inject(TranslateService);
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  readonly languages: LanguageOption[] = [
    { code: 'en', short: 'EN', label: 'English', nativeLabel: 'English', dir: 'ltr' },
    { code: 'ar', short: 'AR', label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl' },
  ];

  readonly currentLang = signal<AppLanguage>(DEFAULT_LANG);

  init(): Promise<void> {
    const lang = this.readStoredLang();
    this.currentLang.set(lang);
    this.applyDocumentDirection(lang);
    this.translate.addLangs(this.languages.map((l) => l.code));
    if (!this.isBrowser) {
      return Promise.resolve();
    }
    this.translate.setFallbackLang(DEFAULT_LANG);
    return firstValueFrom(this.translate.use(lang))
      .then(() => undefined)
      .catch(() => undefined);
  }

  setLanguage(lang: AppLanguage): void {
    if (!this.languages.some((item) => item.code === lang)) {
      return;
    }

    this.currentLang.set(lang);
    this.persistLang(lang);
    this.applyDocumentDirection(lang);
    this.translate.use(lang);
  }

  get currentOption(): LanguageOption {
    return this.languages.find((item) => item.code === this.currentLang()) ?? this.languages[0];
  }

  private readStoredLang(): AppLanguage {
    if (!this.isBrowser) {
      return DEFAULT_LANG;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'ar') {
        return stored;
      }
    } catch {
      // Ignore storage access errors (private mode / SSR).
    }

    const browserLang = this.translate.getBrowserLang();
    return browserLang === 'ar' ? 'ar' : DEFAULT_LANG;
  }

  private persistLang(lang: AppLanguage): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore storage access errors.
    }
  }

  private applyDocumentDirection(lang: AppLanguage): void {
    const html = this.document.documentElement;
    const option = this.languages.find((item) => item.code === lang);
    html.lang = lang;
    html.dir = option?.dir ?? 'ltr';
    html.classList.toggle('rtl', lang === 'ar');
  }
}
