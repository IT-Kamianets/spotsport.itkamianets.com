import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class ScrollService {
	private readonly _platformId = inject(PLATFORM_ID);
	private readonly _document = inject(DOCUMENT);

	/**
	 * Immediately scrolls window, document, and any active scrollable containers to top (0, 0).
	 * Safe for both Web and native Android/iOS (Capacitor) webviews, as well as SSR/prerendering.
	 */
	public scrollToTop(behavior: ScrollBehavior = 'auto'): void {
		if (!isPlatformBrowser(this._platformId)) {
			return;
		}

		try {
			// 1. Standard window scrolling
			if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
				window.scrollTo({ top: 0, left: 0, behavior });
			}

			// 2. Document elements (html, body)
			const docEl = this._document?.documentElement;
			if (docEl) {
				docEl.scrollTop = 0;
				docEl.scrollLeft = 0;
			}

			const body = this._document?.body;
			if (body) {
				body.scrollTop = 0;
				body.scrollLeft = 0;
			}

			// 3. Main container / router-outlet wrapper if present
			const mainEl = this._document?.querySelector('main');
			if (mainEl && mainEl.scrollTop > 0) {
				mainEl.scrollTop = 0;
				mainEl.scrollLeft = 0;
			}

			// 4. Any scrollable modal / dialog / container
			const scrollableContainers = this._document?.querySelectorAll<HTMLElement>(
				'.overflow-y-auto, .overflow-y-scroll, [data-scroll-container]',
			);
			if (scrollableContainers && scrollableContainers.length > 0) {
				scrollableContainers.forEach((el) => {
					el.scrollTop = 0;
					el.scrollLeft = 0;
				});
			}
		} catch (err) {
			console.warn('[ScrollService] scrollToTop error:', err);
		}
	}
}
