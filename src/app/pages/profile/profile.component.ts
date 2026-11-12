import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
	AbstractControl,
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	ValidationErrors,
	ValidatorFn,
	Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LanguageService, TranslateService } from '@wawjs/ngx-translate';
import { ThemeService } from '@wawjs/ngx-ui';
import type { Language } from '@wawjs/ngx-translate';
import type { AppLanguage } from '../../../environments/environment.prod';
import { AuthService } from '../../services/auth.service';

export type ProfileTab = 'personal' | 'history' | 'settings' | 'auth';
export type AuthSubTab = 'login' | 'register' | 'recovery';

const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
	const password = control.get('password')?.value;
	const confirmPassword = control.get('confirmPassword')?.value;

	if (!password || !confirmPassword) {
		return null;
	}

	return password === confirmPassword ? null : { passwordMismatch: true };
};

@Component({
	selector: 'app-profile',
	imports: [NgOptimizedImage, RouterLink, ReactiveFormsModule],
	templateUrl: './profile.component.html',
})
export class ProfileComponent {
	private readonly _route = inject(ActivatedRoute);
	private readonly _router = inject(Router);
	private readonly _translateService = inject(TranslateService);
	private readonly _themeService = inject(ThemeService);
	private readonly _languageService = inject(LanguageService);
	private readonly _authService = inject(AuthService);

	protected readonly currentUser = toSignal(this._authService.authState$, { initialValue: null });

	protected readonly activeTab = signal<ProfileTab>('personal');
	protected readonly activeAuthTab = signal<AuthSubTab>('login');

	// Reactive Forms for in-page Login, Registration & Recovery
	protected readonly loginForm = new FormGroup({
		email: new FormControl('', {
			nonNullable: true,
			validators: [Validators.required, Validators.email],
		}),
		password: new FormControl('', {
			nonNullable: true,
			validators: [Validators.required, Validators.minLength(6)],
		}),
	});

	protected readonly registerForm = new FormGroup(
		{
			email: new FormControl('', {
				nonNullable: true,
				validators: [Validators.required, Validators.email],
			}),
			password: new FormControl('', {
				nonNullable: true,
				validators: [Validators.required, Validators.minLength(6)],
			}),
			confirmPassword: new FormControl('', {
				nonNullable: true,
				validators: [Validators.required],
			}),
		},
		{ validators: [passwordMatchValidator] },
	);

	protected readonly recoveryForm = new FormGroup({
		email: new FormControl('', {
			nonNullable: true,
			validators: [Validators.required, Validators.email],
		}),
	});

	// UI State Signals
	protected readonly authLoading = signal(false);
	protected readonly googleLoading = signal(false);
	protected readonly authError = signal<string | null>(null);
	protected readonly authSuccess = signal<string | null>(null);
	protected readonly showLoginPassword = signal(false);
	protected readonly showRegisterPassword = signal(false);

	// Theme & Language
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
		this.authError.set(null);
		this.authSuccess.set(null);
	}

	protected setAuthTab(tab: AuthSubTab): void {
		this.activeAuthTab.set(tab);
		this.authError.set(null);
		this.authSuccess.set(null);
	}

	protected toggleLoginPassword(): void {
		this.showLoginPassword.update((visible) => !visible);
	}

	protected toggleLoginPasswordVisibility(): void {
		this.toggleLoginPassword();
	}

	protected toggleRegisterPassword(): void {
		this.showRegisterPassword.update((visible) => !visible);
	}

	protected toggleRegisterPasswordVisibility(): void {
		this.toggleRegisterPassword();
	}

	protected async onLoginSubmit(): Promise<void> {
		if (this.loginForm.invalid) {
			this.loginForm.markAllAsTouched();
			return;
		}

		this.authLoading.set(true);
		this.authError.set(null);
		this.authSuccess.set(null);

		const { email, password } = this.loginForm.getRawValue();

		try {
			await this._authService.signIn(email, password);
			this.authSuccess.set('Successfully authenticated!');
			this.loginForm.reset();
			this.activeTab.set('personal');
		} catch (error: unknown) {
			this.authError.set(this._parseFirebaseError(error));
		} finally {
			this.authLoading.set(false);
		}
	}

	protected async onRegisterSubmit(): Promise<void> {
		if (this.registerForm.invalid) {
			this.registerForm.markAllAsTouched();
			return;
		}

		this.authLoading.set(true);
		this.authError.set(null);
		this.authSuccess.set(null);

		const { email, password } = this.registerForm.getRawValue();

		try {
			await this._authService.signUp(email, password);
			this.authSuccess.set(
				'Account created successfully! Verification link sent to your email.',
			);
			this.registerForm.reset();
			this.activeTab.set('personal');
		} catch (error: unknown) {
			this.authError.set(this._parseFirebaseError(error));
		} finally {
			this.authLoading.set(false);
		}
	}

	protected async onRecoverySubmit(): Promise<void> {
		if (this.recoveryForm.invalid) {
			this.recoveryForm.markAllAsTouched();
			return;
		}

		this.authLoading.set(true);
		this.authError.set(null);
		this.authSuccess.set(null);

		const { email } = this.recoveryForm.getRawValue();

		try {
			await this._authService.resetPassword(email);
			this.authSuccess.set(
				'Password reset instructions have been sent to your email address.',
			);
			this.recoveryForm.reset();
		} catch (error: unknown) {
			this.authError.set(this._parseFirebaseError(error));
		} finally {
			this.authLoading.set(false);
		}
	}

	protected async onGoogleSignIn(): Promise<void> {
		this.googleLoading.set(true);
		this.authError.set(null);
		this.authSuccess.set(null);

		try {
			await this._authService.loginWithGoogle();
			this.authSuccess.set('Signed in successfully with Google!');
			this.activeTab.set('personal');
		} catch (error: unknown) {
			this.authError.set(this._parseFirebaseError(error));
		} finally {
			this.googleLoading.set(false);
		}
	}

	protected async signOut(): Promise<void> {
		await this._authService.signOut();
		this.authSuccess.set('You have been signed out.');
		this.activeTab.set('auth');
		this.activeAuthTab.set('login');
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

	private _parseFirebaseError(error: unknown): string {
		if (typeof error === 'object' && error !== null && 'code' in error) {
			const code = (error as { code: string }).code;
			switch (code) {
				case 'auth/invalid-credential':
				case 'auth/user-not-found':
				case 'auth/wrong-password':
					return 'Invalid email or password. Please check your credentials.';
				case 'auth/email-already-in-use':
					return 'This email is already registered. Please sign in instead.';
				case 'auth/invalid-email':
					return 'Please enter a valid email address.';
				case 'auth/weak-password':
					return 'Password is too weak. Please use at least 6 characters.';
				case 'auth/user-disabled':
					return 'This account has been disabled. Please contact support.';
				case 'auth/popup-closed-by-user':
					return 'Google Sign-In popup was closed before completion.';
				case 'auth/network-request-failed':
					return 'Network error. Please check your internet connection.';
				default:
					if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
						return (error as { message: string }).message;
					}
			}
		}
		return 'Authentication failed. Please try again.';
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
