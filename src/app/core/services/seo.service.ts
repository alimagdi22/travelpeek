import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRouteSnapshot } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SEO_METADATA } from '../constants/seo-metadata.config';

export interface SeoConfig {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  robots?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private router = inject(Router);

  private defaultSeo: SeoConfig = {
    title: 'Travelpeek - Discover & Book Your Next Trip',
    description: 'home Explore hand-picked destinations, flights, and unforgettable travel experiences with Travelpeek.',
    keywords: 'travel, flight booking, destinations, travelpeek, flights',
    ogTitle: 'Travelpeek - Discover & Book Your Next Trip',
    ogDescription: 'home Explore hand-picked destinations, flights, and unforgettable travel experiences with Travelpeek.',
    ogImage: 'assets/images/og-default.jpg',
    twitterCard: 'summary_large_image',
    robots: 'index, follow',
  };

  /**
   * Initializes route listener and updates SEO on router navigation events
   * and immediately for current route.
   */
  public initRouteSeoListener(): void {
    // Update immediately for current active snapshot
    this.updateSeoForCurrentRoute();

    // Subscribe to router NavigationEnd events
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateSeoForCurrentRoute();
      });
  }

  private updateSeoForCurrentRoute(): void {
    let route: ActivatedRouteSnapshot | null = this.router.routerState?.snapshot?.root || null;
    let mergedSeo: SeoConfig = {};

    // 1. Traverse current RouterStateSnapshot tree from root to leaf
    while (route) {
      if (route.data && route.data['seo']) {
        mergedSeo = { ...mergedSeo, ...route.data['seo'] };
      }
      route = route.firstChild;
    }

    // 2. Direct fallback by URL matching if mergedSeo is incomplete
    if (!mergedSeo.title && !mergedSeo.description) {
      const url = this.router.url ? this.router.url.split('?')[0].split('#')[0] : '/';
      if (url === '/' || url === '') {
        mergedSeo = SEO_METADATA['home'] || {};
      } else if (url.startsWith('/support')) {
        mergedSeo = SEO_METADATA['support'] || {};
      } else if (url.startsWith('/legal')) {
        mergedSeo = SEO_METADATA['legal'] || {};
      } else if (url.startsWith('/my-trips')) {
        mergedSeo = SEO_METADATA['myTrips'] || {};
      } else if (url.startsWith('/login')) {
        mergedSeo = SEO_METADATA['login'] || {};
      } else if (url.startsWith('/user-management')) {
        mergedSeo = SEO_METADATA['userManagement'] || {};
      }
    }

    console.log('[SeoService] URL:', this.router.url, 'Merged SEO:', mergedSeo);
    this.updateSeo(mergedSeo);
  }

  /**
   * Updates page title and meta tags manually or automatically.
   */
  public updateSeo(config: SeoConfig = {}): void {
    const seoData: SeoConfig = { ...this.defaultSeo, ...config };

    // 1. Update Title
    if (seoData.title) {
      this.titleService.setTitle(seoData.title);
      this.setMetaTag('property', 'og:title', seoData.ogTitle || seoData.title);
      this.setMetaTag('name', 'twitter:title', seoData.twitterTitle || seoData.ogTitle || seoData.title);
    }

    // 2. Update Description
    if (seoData.description) {
      this.setMetaTag('name', 'description', seoData.description);
      this.setMetaTag('property', 'og:description', seoData.ogDescription || seoData.description);
      this.setMetaTag('name', 'twitter:description', seoData.twitterDescription || seoData.ogDescription || seoData.description);
    }

    // 3. Update Keywords
    if (seoData.keywords) {
      this.setMetaTag('name', 'keywords', seoData.keywords);
    }

    // 4. Update Robots
    if (seoData.robots) {
      this.setMetaTag('name', 'robots', seoData.robots);
    }

    // 5. Update OpenGraph Image & Twitter Image
    if (seoData.ogImage) {
      this.setMetaTag('property', 'og:image', seoData.ogImage);
      this.setMetaTag('name', 'twitter:image', seoData.twitterImage || seoData.ogImage);
    }

    // 6. Update OpenGraph URL & Twitter Card
    if (seoData.ogUrl) {
      this.setMetaTag('property', 'og:url', seoData.ogUrl);
    }
    if (seoData.twitterCard) {
      this.setMetaTag('name', 'twitter:card', seoData.twitterCard);
    }
  }

  private setMetaTag(attrName: 'name' | 'property', attrValue: string, content: string): void {
    if (content) {
      const selector = `${attrName}="${attrValue}"`;
      this.metaService.updateTag({ [attrName]: attrValue, content }, selector);
    }
  }
}
