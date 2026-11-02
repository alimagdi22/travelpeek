import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

const EN_DATE_FORMAT = 'hh:mm a, EEE d MMMM yyyy';

export function formatFlightDateTime(
  value: string | Date | null | undefined,
  lang: string,
): string {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  if (lang !== 'ar') {
    return new DatePipe('en-US').transform(date, EN_DATE_FORMAT) || '';
  }

  const time = new Intl.DateTimeFormat('ar', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    numberingSystem: 'latn',
  }).format(date);

  const weekday = new Intl.DateTimeFormat('ar', {
    weekday: 'long',
    numberingSystem: 'latn',
  }).format(date);

  const dayMonthYear = new Intl.DateTimeFormat('ar', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    numberingSystem: 'latn',
  })
    .format(date)
    .replace(/[،,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return `${time}، ${weekday} ${dayMonthYear}`;
}

export function localizeCabinClass(cabin: string, translate: TranslateService): string {
  const raw = (cabin || '').trim();
  if (!raw) {
    return '';
  }

  const cabinType = raw.replace(/\s+class\s*$/i, '').trim();
  const typeKey = cabinClassTypeKey(cabinType);
  const cabinLabel = typeKey ? translate.instant(typeKey) : cabinType;
  return translate.instant('FLIGHTS.CABIN_CLASS', { cabin: cabinLabel });
}

function cabinClassTypeKey(value: string): string | null {
  const normalized = value.toLowerCase();
  if (normalized.includes('premium') && normalized.includes('economy')) {
    return 'FLIGHTS.CABIN_PREMIUM_ECONOMY';
  }
  if (normalized.includes('business')) {
    return 'FLIGHTS.CABIN_BUSINESS';
  }
  if (normalized.includes('first')) {
    return 'FLIGHTS.CABIN_FIRST';
  }
  if (
    normalized.includes('economy') ||
    normalized.includes('coach') ||
    normalized.includes('tourist')
  ) {
    return 'FLIGHTS.CABIN_ECONOMY';
  }
  return null;
}

export function localizeBaggageWeight(weight: string, translate: TranslateService): string {
  if (!weight) {
    return '';
  }
  if (translate.currentLang !== 'ar') {
    return weight;
  }

  return weight
    .replace(/\bPieces\b/gi, translate.instant('FLIGHTS.PIECES'))
    .replace(/\bPiece\b/gi, translate.instant('FLIGHTS.PIECE'))
    .replace(/\bKGs\b/gi, translate.instant('FLIGHTS.KG'))
    .replace(/\bKG\b/gi, translate.instant('FLIGHTS.KG'));
}
