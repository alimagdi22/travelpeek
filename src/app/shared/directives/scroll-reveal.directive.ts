import { Directive, ElementRef, OnInit, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appScrollReveal]'
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  private observer: IntersectionObserver | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.renderer.addClass(this.el.nativeElement, 'revealed');
          } else {
            this.renderer.removeClass(this.el.nativeElement, 'revealed');
          }
        });
      }, {
        root: null, // Default to document viewport (works with nested scroll clipping)
        threshold: 0.05, // Trigger when 5% of the element is visible
        rootMargin: '0px 0px -40px 0px' // Offset to trigger before hitting the viewport fold
      });

      // Delay observing until layout is fully settled to avoid false positives on load
      setTimeout(() => {
        if (this.observer) {
          this.observer.observe(this.el.nativeElement);
        }
      }, 250);
    } else {
      // Fallback for browsers that don't support IntersectionObserver
      this.renderer.addClass(this.el.nativeElement, 'revealed');
    }
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
