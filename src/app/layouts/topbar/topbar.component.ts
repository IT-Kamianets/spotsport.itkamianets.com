import { NgOptimizedImage } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { CompanyService } from '../../feature/company/company.service';
import { MVP_PAGES } from '../../feature/navigation/navigation.const';

@Component({
	selector: 'app-topbar',
	imports: [NgOptimizedImage, RouterLink, RouterLinkActive, TranslateDirective],
	templateUrl: './topbar.component.html',
	styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
	private readonly _companyService = inject(CompanyService);
	private readonly _router = inject(Router);

	protected readonly navPages = MVP_PAGES.filter((page) => page.id !== 'home');
	protected readonly mobileNavOpen = signal(false);
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
}
