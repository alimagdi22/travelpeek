import { Component, inject, NgZone, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { SharedService } from '../../../../shared/shared.service';
import { HomePageService } from 'rp-travel-ui';

@Component({
  selector: 'app-hero-section',
  standalone: false,
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.scss',
})
export class HeroSectionComponent implements OnInit, OnDestroy {
  router = inject(Router);
  sharedService = inject(SharedService);
  homePageService = inject(HomePageService);
  platformId = inject(PLATFORM_ID);
  private zone = inject(NgZone);
  isBrowser = isPlatformBrowser(this.platformId);
  searchQuery: string = '';
  isListening = false;
  recordingSeconds = 0;
  readonly maxRecordingSeconds = 35;
  pendingVoice: File | null = null;
  pendingVoiceUrl = '';
  pendingVoiceDuration = 0;
  isVoicePlaying = false;
  voiceRecorderError = '';
  private speechRecognition: any = null;
  private restartSpeechRecognition = false;
  private typedBeforeVoice = '';
  private speechRestartTimer: ReturnType<typeof setTimeout> | null = null;
  private speechErrorCount = 0;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private recordingChunks: Blob[] = [];
  private recordingTimer: ReturnType<typeof setInterval> | null = null;
  private recordingLimitTimer: ReturnType<typeof setTimeout> | null = null;
  private stopPromise: Promise<File | null> | null = null;
  private recordingStopResolver: ((file: File | null) => void) | null = null;
  private discardNextRecording = false;

  cards = [
    { city: 'Bangkok', country: 'Thailand', code: 'BKK', price: 'AED 890' },
    { city: 'London', country: 'United Kingdom', code: 'LHR', price: 'AED 1,240' },
    { city: 'Istanbul', country: 'Turkey', code: 'IST', price: 'AED 750' }
  ];

  cities: string[] = [
    'Istanbul',
    'Dubai',
    'Cairo',
    'Paris',
    'London',
    'Tokyo',
    'Rome',
    'New York',
    'Bangkok',
    'Barcelona',
    'Amsterdam',
    'Singapore',
    'Madrid',
    'Kuala Lumpur'
  ];
  currentCityIndex = 0;
  placeholderText: string = 'Cheapest flights to Istanbul';

  activeIndex = 0;
  private intervalId: any;
  private placeholderIntervalId: any;

  get totalCards(): number {
    if (!this.homePageService.isLoading && this.homePageService.mostSearchedFlights?.length) {
      return Math.min(this.homePageService.mostSearchedFlights.length, 3);
    }
    return this.cards.length;
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.startCardRotation();
      this.startPlaceholderRotation();
    }
    this.homePageService.getMostSearchedFlights();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.placeholderIntervalId) {
      clearInterval(this.placeholderIntervalId);
    }
    this.cancelVoice();
    this.clearPendingVoice();
  }

  startPlaceholderRotation() {
    this.placeholderIntervalId = setInterval(() => {
      this.currentCityIndex = (this.currentCityIndex + 1) % this.cities.length;
      this.placeholderText = `Cheapest flights to ${this.cities[this.currentCityIndex]}`;
    }, 1000);
  }

  startCardRotation() {
    this.intervalId = setInterval(() => {
      const total = this.totalCards;
      if (total > 0) {
        this.activeIndex = (this.activeIndex + 1) % total;
      }
    }, 3000); // Rotate every 3 seconds
  }

  getCardClass(cardIndex: number): string {
    const total = this.totalCards;
    if (total <= 0) return 'card-bottom';
    const relativeIndex = (cardIndex - this.activeIndex + total) % total;
    if (relativeIndex === 0) return 'card-top';
    if (relativeIndex === 1) return 'card-middle';
    return 'card-bottom';
  }

  getArrivalAirport(card: any) {
    const flight = card?.cheapestAirItinerary?.allJourney?.flights?.[0];
    const dto = flight?.flightDTO;
    if (dto && dto.length > 0) {
      return dto[dto.length - 1]?.arrivalTerminalAirport?.en;
    }
    return null;
  }

  getCountryName(card: any): string {
    return this.getArrivalAirport(card)?.countryName || '';
  }

  getCityName(card: any): string {
    return this.getArrivalAirport(card)?.cityName || '';
  }

  getAirportCode(card: any): string {
    return this.getArrivalAirport(card)?.airportCode || '';
  }

  getCardCurrency(card: any): string {
    return card?.cheapestAirItinerary?.itinTotalFare?.currencyCode || '';
  }

  getCardPrice(card: any): string {
    const amount = card?.cheapestAirItinerary?.itinTotalFare?.amount;
    if (amount !== undefined && amount !== null) {
      return amount % 1 === 0 ? amount.toString() : amount.toFixed(2);
    }
    return '';
  }

  onCardClick(card: any) {
    if (!card) return;

    // Extract departure city name
    const departureAirport = card?.cheapestAirItinerary?.allJourney?.flights?.[0]?.flightDTO?.[0]?.departureTerminalAirport?.en;
    const deptCity = departureAirport?.cityName;

    // Extract arrival city name
    const arrivalAirport = this.getArrivalAirport(card);
    const arrCity = arrivalAirport?.cityName;

    // Extract arrivalDate
    const arrivalDate = card?.cheapestAirItinerary?.arrivalDate;

    if (deptCity && arrCity && arrivalDate) {
      const dateOnly = arrivalDate.split('T')[0];
      const query = `i want to travel from ${deptCity} to ${arrCity} on ${dateOnly}`;
      this.performSearch(query);
    }
  }

  onSearchKeydown() {
    if (this.isListening) {
      void this.stopVoiceAndKeepRecording();
      return;
    }
    this.submitHomeSearch();
  }

  toggleVoice() {
    if (!this.isBrowser) return;
    if (this.isListening) {
      void this.stopVoiceAndKeepRecording();
      return;
    }
    void this.startVoice();
  }

  performSearch(query?: string) {
    const q = query || this.searchQuery;
    if (!q || !q.trim()) return;

    this.sharedService.setSearchQuery(q.trim());
    this.router.navigate(['/my-trips']);
  }

  private submitHomeSearch() {
    const transcript = this.searchQuery.trim();
    if (this.pendingVoice) {
      this.sharedService.setPendingVoiceSearch(this.pendingVoice, transcript);
      if (transcript) {
        this.sharedService.setSearchQuery(transcript);
      }
      this.router.navigate(['/my-trips']);
      return;
    }
    this.performSearch();
  }

  formatRecordingTime(totalSeconds: number): string {
    const safeSeconds = Math.max(0, Math.min(totalSeconds, this.maxRecordingSeconds));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  togglePendingVoicePlayback(audio: HTMLAudioElement) {
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => {
        this.isVoicePlaying = true;
      }).catch(() => {
        this.isVoicePlaying = false;
      });
      return;
    }
    audio.pause();
    this.isVoicePlaying = false;
  }

  clearPendingVoice() {
    if (this.pendingVoiceUrl) {
      URL.revokeObjectURL(this.pendingVoiceUrl);
    }
    this.pendingVoice = null;
    this.pendingVoiceUrl = '';
    this.pendingVoiceDuration = 0;
    this.isVoicePlaying = false;
  }

  private startVoice() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      this.voiceRecorderError = 'Voice recording is not supported in this browser.';
      return;
    }

    this.clearPendingVoice();
    this.cancelVoice();
    this.typedBeforeVoice = this.searchQuery.trim();
    this.voiceRecorderError = '';
    this.isListening = true;
    this.restartSpeechRecognition = true;
    this.speechErrorCount = 0;
    this.discardNextRecording = false;
    this.recordingChunks = [];
    this.recordingSeconds = 0;

    this.startSpeechRecognition();
    void this.startMediaRecording();
  }

  private async startMediaRecording() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      this.isListening = false;
      this.restartSpeechRecognition = false;
      this.voiceRecorderError = 'Microphone access is needed to record.';
      this.stopSpeechRecognition();
      return;
    }

    if (!this.isListening) {
      this.releaseMediaStream();
      return;
    }

    const mimeType = this.pickAudioMimeType();
    try {
      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.mediaStream, { mimeType })
        : new MediaRecorder(this.mediaStream);
    } catch {
      this.releaseMediaStream();
      this.isListening = false;
      this.voiceRecorderError = 'Recording is not supported in this browser.';
      return;
    }

    const recorder = this.mediaRecorder;
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data?.size) {
        this.recordingChunks.push(event.data);
      }
    };
    this.mediaRecorder.onstop = () => {
      const type = recorder?.mimeType || mimeType || 'audio/webm';
      const blob = new Blob(this.recordingChunks, { type });
      const duration = this.recordingSeconds;
      const discard = this.discardNextRecording;
      this.discardNextRecording = false;
      if (this.mediaRecorder === recorder) {
        this.releaseMediaStream();
      }
      let file: File | null = null;
      if (!discard && blob.size > 0) {
        const extension = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
        file = new File([blob], `voice-message.${extension}`, { type });
        this.zone.run(() => this.setPendingVoice(file!, duration));
      }
      this.recordingStopResolver?.(file);
      this.recordingStopResolver = null;
      this.stopPromise = null;
    };
    this.mediaRecorder.start(250);
    this.recordingTimer = setInterval(() => {
      this.zone.run(() => {
        this.recordingSeconds = Math.min(this.recordingSeconds + 1, this.maxRecordingSeconds);
      });
    }, 1000);
    this.recordingLimitTimer = setTimeout(() => {
      this.zone.run(() => {
        void this.stopVoiceAndKeepRecording();
      });
    }, this.maxRecordingSeconds * 1000);

    if (this.isListening && this.restartSpeechRecognition && !this.speechRecognition) {
      this.startSpeechRecognition();
    }
  }

  private async stopVoiceAndKeepRecording() {
    this.stopSpeechRecognition();
    this.clearRecordingTimers();
    await this.stopMediaRecorder();
    this.isListening = false;
    this.typedBeforeVoice = '';
  }

  private setPendingVoice(file: File, durationSeconds: number) {
    this.clearPendingVoice();
    this.pendingVoice = file;
    this.pendingVoiceDuration = durationSeconds;
    this.pendingVoiceUrl = URL.createObjectURL(file);
  }

  private cancelVoice() {
    this.discardNextRecording = true;
    this.stopSpeechRecognition();
    this.clearRecordingTimers();
    void this.stopMediaRecorder();
    this.isListening = false;
    this.typedBeforeVoice = '';
  }

  private clearRecordingTimers() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    if (this.recordingLimitTimer) {
      clearTimeout(this.recordingLimitTimer);
      this.recordingLimitTimer = null;
    }
  }

  private startSpeechRecognition() {
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = /[\u0600-\u06FF]/.test(`${this.typedBeforeVoice} ${this.searchQuery}`) ? 'ar-SA' : 'en-US';
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      this.speechErrorCount = 0;
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0]?.transcript || '';
      }
      this.zone.run(() => {
        const spoken = String(transcript || '').trim();
        this.searchQuery = this.typedBeforeVoice
          ? (spoken ? `${this.typedBeforeVoice} ${spoken}` : this.typedBeforeVoice)
          : spoken;
      });
    };
    recognition.onerror = (event: any) => {
      const error = String(event?.error || '');
      this.zone.run(() => {
        if (error === 'not-allowed' || error === 'service-not-allowed') {
          this.restartSpeechRecognition = false;
          return;
        }
        if (error === 'no-speech' || error === 'aborted' || error === 'audio-capture' || error === 'network') {
          return;
        }
        this.speechErrorCount++;
        if (this.speechErrorCount >= 3) {
          this.restartSpeechRecognition = false;
        }
      });
    };
    recognition.onend = () => {
      this.zone.run(() => this.scheduleSpeechRestart(recognition));
    };
    this.speechRecognition = recognition;
    try {
      this.zone.runOutsideAngular(() => recognition.start());
    } catch {
      this.speechRecognition = null;
      this.restartSpeechRecognition = false;
    }
  }

  private scheduleSpeechRestart(recognition: any) {
    if (!this.restartSpeechRecognition || !this.isListening || this.speechRecognition !== recognition) {
      return;
    }
    this.typedBeforeVoice = this.searchQuery.trim();
    if (this.speechRestartTimer) {
      clearTimeout(this.speechRestartTimer);
    }
    this.speechRestartTimer = setTimeout(() => {
      if (!this.restartSpeechRecognition || !this.isListening || this.speechRecognition !== recognition) {
        return;
      }
      try {
        this.zone.runOutsideAngular(() => recognition.start());
      } catch {
        this.restartSpeechRecognition = false;
      }
    }, 250);
  }

  private stopSpeechRecognition() {
    this.restartSpeechRecognition = false;
    if (this.speechRestartTimer) {
      clearTimeout(this.speechRestartTimer);
      this.speechRestartTimer = null;
    }
    const recognition = this.speechRecognition;
    this.speechRecognition = null;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    try {
      recognition.stop();
    } catch {
      try {
        recognition.abort();
      } catch {
        // Already stopped.
      }
    }
  }

  private stopMediaRecorder(): Promise<File | null> {
    if (this.stopPromise) return this.stopPromise;
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      this.releaseMediaStream();
      return Promise.resolve(null);
    }
    this.stopPromise = new Promise((resolve) => {
      this.recordingStopResolver = resolve;
      try {
        this.mediaRecorder?.stop();
      } catch {
        resolve(null);
        this.recordingStopResolver = null;
        this.stopPromise = null;
      }
    });
    return this.stopPromise;
  }

  private releaseMediaStream() {
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
    this.mediaRecorder = null;
  }

  private pickAudioMimeType(): string {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    return types.find((type) => MediaRecorder.isTypeSupported(type)) || '';
  }
}
