import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LanguageService, TranslateService } from '@wawjs/ngx-translate';
import { ThemeService } from '@wawjs/ngx-ui';
import type { Language } from '@wawjs/ngx-translate';
import type { AppLanguage } from '../../../environments/environment.prod';

export type ProfileTab = 'personal' | 'history' | 'settings' | 'auth';
export type AuthSubTab = 'login' | 'register' | 'recovery';

@Component({
	selector: 'app-profile',
	imports: [NgOptimizedImage],
	templateUrl: './profile.component.html',
})
export class ProfileComponent {
	private readonly _route = inject(ActivatedRoute);
	private readonly _router = inject(Router);
	private readonly _translateService = inject(TranslateService);
	private readonly _themeService = inject(ThemeService);
	private readonly _languageService = inject(LanguageService);

	protected readonly activeTab = signal<ProfileTab>('personal');
	protected readonly activeAuthTab = signal<AuthSubTab>('login');

	protected readonly mode = computed(() => this._themeService.mode() ?? 'light');
	protected readonly languageMenuOpen = signal(false);
	protected readonly languages = computed(() =>
		this._languageService.languages().map((language) => _toAppLanguage(language)),
	);
	protected readonly activeLanguage = this._languageService.language;
	protected readonly currentLanguage = computed(() =>
		_toAppLanguage(this._languageService.getLanguage(this.activeLanguage())),
	);
	protected readonly toggleIcon = computed(() =>
		this.mode() === 'dark' ? 'light_mode' : 'dark_mode',
	);
	protected readonly toggleLabel = computed(() => {
		this.activeLanguage();
		return this.mode() === 'dark'
			? this._translateService.translate('Switch to light mode')()
			: this._translateService.translate('Switch to dark mode')();
	});
	protected readonly languageMenuLabel = computed(() => {
		this.activeLanguage();
		return this._translateService.translate('Open language menu')();
	});
	protected readonly languageCycleLabel = computed(() => {
		this.activeLanguage();
		return `${this._translateService.translate('Switch language to')()} ${this.getNextLanguage().nativeName}`;
	});

	constructor() {
		this._themeService.init();

		this._route.queryParams.subscribe((params) => {
			const tab = params['tab'];
			if (tab === 'login' || tab === 'auth') {
				this.activeTab.set('auth');
				this.activeAuthTab.set('login');
			} else if (tab === 'register') {
				this.activeTab.set('auth');
				this.activeAuthTab.set('register');
			} else if (tab === 'recovery') {
				this.activeTab.set('auth');
				this.activeAuthTab.set('recovery');
			} else if (tab === 'history' || tab === 'settings' || tab === 'personal') {
				this.activeTab.set(tab);
			}
		});
	}

	protected setTab(tab: ProfileTab): void {
		this.activeTab.set(tab);
	}

	protected setAuthTab(tab: AuthSubTab): void {
		this.activeAuthTab.set(tab);
	}

	protected toggleMode(): void {
		const nextMode = this.mode() === 'dark' ? 'light' : 'dark';
		this._themeService.setMode(nextMode);
	}

	protected async nextLanguage(): Promise<void> {
		const nextLanguage = this.getNextLanguage();
		await this._translateService.setLanguage(nextLanguage.code);
		await this._router.navigateByUrl(this._router.url);
		this.languageMenuOpen.set(false);
	}

	protected toggleLanguageMenu(): void {
		this.languageMenuOpen.update((open) => !open);
	}

	protected async setLanguage(language: AppLanguage): Promise<void> {
		await this._translateService.setLanguage(language.code);
		await this._router.navigateByUrl(this._router.url);
		this.languageMenuOpen.set(false);
	}

	protected getNextLanguage(): AppLanguage {
		const languages = this.languages();
		const currentCode = this.currentLanguage().code;
		const currentIndex = languages.findIndex((language) => language.code === currentCode);

		return languages[(currentIndex + 1) % languages.length] ?? languages[0]!;
	}
}

function _toAppLanguage(language: Language | undefined): AppLanguage {
	const fallback: AppLanguage = {
		code: 'en',
		name: 'English',
		nativeName: 'English',
		flagSrc: 'flags/united-kingdom.svg',
		htmlLang: 'en',
		population: 0,
	};

	return { ...fallback, ...(language as Partial<AppLanguage> | undefined) };
}
