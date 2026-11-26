import { DOCUMENT } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ScrollService } from './services/scroll.service';
import { CanonicalService } from '@wawjs/ngx-default';
import { LanguageService } from '@wawjs/ngx-translate';
import { ThemeService } from '@wawjs/ngx-ui';
import { environment } from '../environments/environment';
import { FooterComponent } from './layouts/footer/footer.component';
import { TopbarComponent } from './layouts/topbar/topbar.component';
import { BottomNavComponent } from './layouts/bottom-nav/bottom-nav.component';

@Component({
	selector: 'app-root',
	imports: [RouterOutlet, TopbarComponent, FooterComponent, BottomNavComponent],
	template: `
		<div class="flex min-h-screen flex-col pb-20 md:pb-0">
			<app-topbar />
			<main class="flex-1">
				<router-outlet />
			</main>
			<app-footer />
			<app-bottom-nav />
		</div>
	`,
})
export class App {
	private readonly _canonicalService = inject(CanonicalService);
	private readonly _document = inject(DOCUMENT);
	private readonly _languageService = inject(LanguageService);
	private readonly _themeService = inject(ThemeService);
	private readonly _router = inject(Router);
	private readonly _scrollService = inject(ScrollService);

	constructor() {
		this._themeService.init();
		this._canonicalService.initialize();

		this._router.events
			.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
			.subscribe(() => {
				this._scrollService.scrollToTop();
			});

		effect(() => {
			const language = this._languageService.language();
			const htmlLang =
				environment.languages.find((item) => item.code === language)?.htmlLang ?? language;

			if (htmlLang) {
				this._document.documentElement.lang = htmlLang;
			}
		});
	}
}
