import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
	AbstractControl,
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	ValidationErrors,
	Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LanguageService, TranslateService } from '@wawjs/ngx-translate';
import { ThemeService } from '@wawjs/ngx-ui';
import type { Language } from '@wawjs/ngx-translate';
import type { AppLanguage } from '../../../environments/environment.prod';
import { AuthService } from '../../services/auth.service';

export type ProfileTab = 'personal' | 'history' | 'settings' | 'auth';
export type AuthSubTab = 'register' | 'login' | 'recovery';

@Component({
	selector: 'app-profile',
	imports: [NgOptimizedImage, ReactiveFormsModule],
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
	protected readonly activeAuthTab = signal<AuthSubTab>('register');

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

	// Registration form fields
	protected readonly regEmail = new FormControl('', {
		nonNullable: true,
		validators: [Validators.required, Validators.email],
	});
	protected readonly regPassword = new FormControl('', {
		nonNullable: true,
		validators: [Validators.required, Validators.minLength(6)],
	});
	protected readonly regConfirmPassword = new FormControl('', {
		nonNullable: true,
		validators: [Validators.required],
	});
	protected readonly regFullName = new FormControl('', { nonNullable: true });

	protected readonly registerForm = new FormGroup(
		{
			email: this.regEmail,
			password: this.regPassword,
			confirmPassword: this.regConfirmPassword,
			fullName: this.regFullName,
		},
		{
			validators: (control: AbstractControl): ValidationErrors | null => {
				const p = control.get('password')?.value;
				const cp = control.get('confirmPassword')?.value;
				return p && cp && p !== cp ? { passwordMismatch: true } : null;
			},
		},
	);

	// Sign In form fields
	protected readonly loginEmail = new FormControl('', {
		nonNullable: true,
		validators: [Validators.required, Validators.email],
	});
	protected readonly loginPassword = new FormControl('', {
		nonNullable: true,
		validators: [Validators.required, Validators.minLength(6)],
	});

	protected readonly loginForm = new FormGroup({
		email: this.loginEmail,
		password: this.loginPassword,
	});

	// Password Recovery form fields
	protected readonly recoveryEmail = new FormControl('', {
		nonNullable: true,
		validators: [Validators.required, Validators.email],
	});
	protected readonly recoveryForm = new FormGroup({
		email: this.recoveryEmail,
	});

	protected readonly authLoading = signal(false);
	protected readonly googleLoading = signal(false);
	protected readonly authError = signal<string | null>(null);
	protected readonly authSuccess = signal<string | null>(null);
	protected readonly showRegisterPassword = signal(false);
	protected readonly showLoginPassword = signal(false);

	constructor() {
		this._themeService.init();

		this._route.queryParams.subscribe((params) => {
			const tab = params['tab'];
			if (tab === 'login') {
				this.activeTab.set('auth');
				this.activeAuthTab.set('login');
			} else if (tab === 'register' || tab === 'auth') {
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

	protected toggleMode(): void {
		const nextMode = this.mode() === 'dark' ? 'light' : 'dark';
		this._themeService.setMode(nextMode);
	}

	protected toggleRegisterPasswordVisibility(): void {
		this.showRegisterPassword.update((v) => !v);
	}

	protected toggleLoginPasswordVisibility(): void {
		this.showLoginPassword.update((v) => !v);
	}

	// Register with Email & Password (Syncs with Cloud Firestore)
	protected async onRegisterSubmit(): Promise<void> {
		if (this.registerForm.invalid) {
			this.registerForm.markAllAsTouched();
			return;
		}

		this.authLoading.set(true);
		this.authError.set(null);
		this.authSuccess.set(null);

		const { email, password, fullName } = this.registerForm.getRawValue();

		try {
			await this._authService.registerWithEmail(email, password, { fullName });
			this.authSuccess.set(
				'Registration successful! Verification email sent and angler profile saved to Firestore database.',
			);
			this.registerForm.reset();
		} catch (error: unknown) {
			this.authError.set(this._parseFirebaseError(error));
		} finally {
			this.authLoading.set(false);
		}
	}

	// Sign In with Email & Password
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
			await this._authService.signInWithEmail(email, password);
			this.authSuccess.set('Successfully signed in! Angler profile loaded from Firestore.');
			this.loginForm.reset();
		} catch (error: unknown) {
			this.authError.set(this._parseFirebaseError(error));
		} finally {
			this.authLoading.set(false);
		}
	}

	// Functional Authentication with Google (Syncs with Cloud Firestore)
	protected async onGoogleSignIn(): Promise<void> {
		this.googleLoading.set(true);
		this.authError.set(null);
		this.authSuccess.set(null);

		try {
			await this._authService.loginWithGoogle();
			this.authSuccess.set(
				'Successfully authenticated with Google! Angler profile synced to Cloud Firestore database.',
			);
		} catch (error: unknown) {
			this.authError.set(this._parseFirebaseError(error));
		} finally {
			this.googleLoading.set(false);
		}
	}

	// Password Recovery Flow
	protected async onRecoverySubmit(): Promise<void> {
		if (this.recoveryForm.invalid) {
			this.recoveryForm.markAllAsTouched();
			return;
		}

		this.authLoading.set(true);
		this.authError.set(null);
		this.authSuccess.set(null);

		try {
			await this._authService.sendPasswordReset(this.recoveryEmail.value);
			this.authSuccess.set('Password reset link sent to your email.');
			this.recoveryForm.reset();
		} catch (error: unknown) {
			this.authError.set(this._parseFirebaseError(error));
		} finally {
			this.authLoading.set(false);
		}
	}

	protected async signOut(): Promise<void> {
		await this._authService.signOut();
		this.authSuccess.set('Signed out successfully.');
	}

	private _parseFirebaseError(error: unknown): string {
		if (typeof error === 'object' && error !== null && 'code' in error) {
			const code = (error as { code: string }).code;
			switch (code) {
				case 'auth/email-already-in-use':
					return 'This email is already registered. Please sign in instead.';
				case 'auth/invalid-email':
					return 'Please enter a valid email address.';
				case 'auth/weak-password':
					return 'Password is too weak. Please use at least 6 characters.';
				case 'auth/invalid-credential':
				case 'auth/wrong-password':
				case 'auth/user-not-found':
					return 'Invalid email or password. Please verify your credentials.';
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
		return 'Authentication request failed. Please try again.';
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
