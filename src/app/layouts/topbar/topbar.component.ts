import { NgOptimizedImage } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { CompanyService } from '../../feature/company/company.service';
import { MVP_PAGES } from '../../feature/navigation/navigation.const';
import { AppLang, TranslationService } from '../../services/translation.service';

@Component({
	selector: 'app-topbar',
	imports: [NgOptimizedImage, RouterLink, RouterLinkActive, TranslateDirective],
	templateUrl: './topbar.component.html',
	styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
	private readonly _companyService = inject(CompanyService);
	private readonly _router = inject(Router);
	public readonly ts = inject(TranslationService);

	protected readonly navPages = MVP_PAGES.filter((page) => page.id !== 'home');
	protected readonly githubRepoUrl = 'https://github.com/IT-Kamianets/spotsport.itkamianets.com';
	protected readonly mobileNavOpen = signal(false);
	protected readonly languageMenuOpen = signal(false);
	protected readonly isProfilePage = signal(false);
	protected readonly company = this._companyService.company;

	constructor() {
		this._router.events
			.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
			.subscribe((event) => {
				this.isProfilePage.set(event.urlAfterRedirects.startsWith('/profile'));
			});

		this.isProfilePage.set(this._router.url.startsWith('/profile'));
	}

	protected toggleMobileNav(): void {
		this.mobileNavOpen.update((v) => !v);
	}

	protected closeMobileNav(): void {
		this.mobileNavOpen.set(false);
	}

	protected toggleLanguageMenu(): void {
		this.languageMenuOpen.update((open) => !open);
	}

	protected selectLanguage(lang: AppLang): void {
		this.ts.setLanguage(lang);
		this.languageMenuOpen.set(false);
	}

	protected getPageTitle(pageId: string, fallback: string): string {
		const key = 'nav.' + pageId;
		const translated = this.ts.t(key);
		return translated !== key ? translated : fallback;
	}

	protected getPageSummary(pageId: string, fallback: string): string {
		const key = 'nav.' + pageId + 'Desc';
		const translated = this.ts.t(key);
		return translated !== key ? translated : fallback;
	}
}
