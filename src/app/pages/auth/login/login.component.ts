import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
	selector: 'app-login',
	imports: [ReactiveFormsModule, RouterLink],
	templateUrl: './login.component.html',
})
export class LoginComponent {
	private readonly _authService = inject(AuthService);
	private readonly _router = inject(Router);
	private readonly _route = inject(ActivatedRoute);

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

	protected readonly isLoading = signal(false);
	protected readonly isGoogleLoading = signal(false);
	protected readonly errorMessage = signal<string | null>(null);
	protected readonly showPassword = signal(false);

	protected togglePasswordVisibility(): void {
		this.showPassword.update((visible) => !visible);
	}

	protected async onSubmit(): Promise<void> {
		if (this.loginForm.invalid) {
			this.loginForm.markAllAsTouched();
			return;
		}

		this.isLoading.set(true);
		this.errorMessage.set(null);

		const { email, password } = this.loginForm.getRawValue();

		try {
			await this._authService.signIn(email, password);
			await this._navigateAfterAuth();
		} catch (error: unknown) {
			this.errorMessage.set(this._parseFirebaseError(error));
		} finally {
			this.isLoading.set(false);
		}
	}

	protected async onGoogleSignIn(): Promise<void> {
		this.isGoogleLoading.set(true);
		this.errorMessage.set(null);

		try {
			await this._authService.loginWithGoogle();
			await this._navigateAfterAuth();
		} catch (error: unknown) {
			this.errorMessage.set(this._parseFirebaseError(error));
		} finally {
			this.isGoogleLoading.set(false);
		}
	}

	private async _navigateAfterAuth(): Promise<void> {
		const returnUrl = this._route.snapshot.queryParams['returnUrl'] || '/home';
		await this._router.navigateByUrl(returnUrl);
	}

	private _parseFirebaseError(error: unknown): string {
		if (typeof error === 'object' && error !== null && 'code' in error) {
			const code = (error as { code: string }).code;
			switch (code) {
				case 'auth/invalid-credential':
				case 'auth/user-not-found':
				case 'auth/wrong-password':
					return 'Invalid email or password. Please verify your credentials.';
				case 'auth/invalid-email':
					return 'Please enter a valid email address.';
				case 'auth/user-disabled':
					return 'This account has been disabled. Please contact support.';
				case 'auth/too-many-requests':
					return 'Too many failed login attempts. Please try again later.';
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
		return 'Failed to sign in. Please try again.';
	}
}
