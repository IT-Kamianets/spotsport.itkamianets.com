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
import { ActivatedRoute } from '@angular/router';
import { ThemeService } from '@wawjs/ngx-ui';
import { AuthService } from '../../services/auth.service';
import { AppLang, TranslationService } from '../../services/translation.service';

export type ProfileTab = 'personal' | 'history' | 'settings' | 'auth';
export type AuthSubTab = 'register' | 'login' | 'recovery';

@Component({
	selector: 'app-profile',
	imports: [ReactiveFormsModule],
	templateUrl: './profile.component.html',
})
export class ProfileComponent {
	private readonly _route = inject(ActivatedRoute);
	private readonly _themeService = inject(ThemeService);
	private readonly _authService = inject(AuthService);
	public readonly ts = inject(TranslationService);

	protected readonly currentUser = toSignal(this._authService.authState$, { initialValue: null });

	protected readonly activeTab = signal<ProfileTab>('personal');
	protected readonly activeAuthTab = signal<AuthSubTab>('register');

	protected readonly mode = computed(() => this._themeService.mode() ?? 'light');
	protected readonly languageMenuOpen = signal(false);
	protected readonly languages = computed(() => this.ts.availableLanguages);
	protected readonly currentLanguage = computed(() => this.ts.currentLangOption());

	protected readonly toggleIcon = computed(() =>
		this.mode() === 'dark' ? 'light_mode' : 'dark_mode',
	);
	protected readonly toggleLabel = computed(() => {
		return this.mode() === 'dark'
			? this.ts.t('settings.switchToLight')
			: this.ts.t('settings.switchToDark');
	});
	protected readonly languageMenuLabel = computed(() => {
		return this.ts.t('lang.openMenu');
	});
	protected readonly languageCycleLabel = computed(() => {
		return `${this.ts.t('lang.switch')} ${this.getNextLanguage().nativeName}`;
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
			this.authSuccess.set(this.ts.t('msg.registerSuccess'));
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
			this.authSuccess.set(this.ts.t('msg.signInSuccess'));
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
			this.authSuccess.set(this.ts.t('msg.googleSuccess'));
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
			this.authSuccess.set(this.ts.t('msg.recoverySuccess'));
			this.recoveryForm.reset();
		} catch (error: unknown) {
			this.authError.set(this._parseFirebaseError(error));
		} finally {
			this.authLoading.set(false);
		}
	}

	protected async signOut(): Promise<void> {
		await this._authService.signOut();
		this.authSuccess.set(this.ts.t('msg.signOutSuccess'));
	}

	private _parseFirebaseError(error: unknown): string {
		const isUk = this.ts.currentLang() === 'uk';
		if (typeof error === 'object' && error !== null && 'code' in error) {
			const code = (error as { code: string }).code;
			switch (code) {
				case 'auth/email-already-in-use':
					return isUk
						? 'Ця електронна пошта вже зареєстрована. Будь ласка, здійсніть вхід.'
						: 'This email is already registered. Please sign in instead.';
				case 'auth/invalid-email':
					return isUk
						? 'Будь ласка, введіть коректну адресу електронної пошти.'
						: 'Please enter a valid email address.';
				case 'auth/weak-password':
					return isUk
						? 'Занадто слабкий пароль. Використовуйте щонайменше 6 символів.'
						: 'Password is too weak. Please use at least 6 characters.';
				case 'auth/invalid-credential':
				case 'auth/wrong-password':
				case 'auth/user-not-found':
					return isUk
						? 'Невірний email або пароль. Будь ласка, перевірте ваші дані.'
						: 'Invalid email or password. Please verify your credentials.';
				case 'auth/popup-closed-by-user':
					return isUk
						? 'Вікно авторизації Google було закрито до завершення.'
						: 'Google Sign-In popup was closed before completion.';
				case 'auth/network-request-failed':
					return isUk
						? 'Помилка мережі. Будь ласка, перевірте зʼєднання з Інтернетом.'
						: 'Network error. Please check your internet connection.';
				default:
					if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
						return (error as { message: string }).message;
					}
			}
		}
		return isUk
			? 'Запит на автентифікацію не вдався. Будь ласка, спробуйте знову.'
			: 'Authentication request failed. Please try again.';
	}

	protected nextLanguage(): void {
		const next = this.ts.getNextLanguage();
		this.ts.setLanguage(next.code);
		this.languageMenuOpen.set(false);
	}

	protected toggleLanguageMenu(): void {
		this.languageMenuOpen.update((open) => !open);
	}

	protected setLanguage(language: { code: string }): void {
		const code: AppLang = language.code === 'uk' || language.code === 'ua' ? 'uk' : 'en';
		this.ts.setLanguage(code);
		this.languageMenuOpen.set(false);
	}

	protected getNextLanguage() {
		return this.ts.getNextLanguage();
	}
}
