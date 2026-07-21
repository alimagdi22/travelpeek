import { Directive, ElementRef, Input, Output, EventEmitter, OnChanges, SimpleChanges, Renderer2, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appTypewriter]'
})
export class TypewriterDirective implements OnChanges, OnDestroy {
  @Input('appTypewriter') text: string = '';
  @Input() animate: boolean = false;
  @Input() speedMs: number = 15; // Speed: 15ms per character
  @Output() typeEnd = new EventEmitter<void>();

  private typingTimer: any;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['text'] || changes['animate']) {
      this.applyTypewriter();
    }
  }

  private applyTypewriter() {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }

    if (!this.text) {
      this.renderer.setProperty(this.el.nativeElement, 'innerHTML', '');
      return;
    }

    if (!this.animate) {
      // Direct render, no cursor or animation
      this.renderer.setProperty(this.el.nativeElement, 'textContent', this.text);
      return;
    }

    // Clear contents
    this.renderer.setProperty(this.el.nativeElement, 'innerHTML', '');

    // Create the cursor element
    const cursor = this.renderer.createElement('span');
    this.renderer.addClass(cursor, 'typewriter-cursor');

    // Create text node for typed characters
    const textNode = this.renderer.createText('');
    this.renderer.appendChild(this.el.nativeElement, textNode);
    this.renderer.appendChild(this.el.nativeElement, cursor);

    let currentIndex = 0;
    const fullText = this.text;

    const type = () => {
      if (currentIndex < fullText.length) {
        this.renderer.setProperty(textNode, 'textContent', fullText.substring(0, ++currentIndex));
        this.typingTimer = setTimeout(type, this.speedMs);
      } else {
        // Typing ended: remove cursor from DOM
        this.renderer.removeChild(this.el.nativeElement, cursor);
        this.typingTimer = null;
        this.typeEnd.emit();
      }
    };

    type();
  }

  ngOnDestroy(): void {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
  }
}
