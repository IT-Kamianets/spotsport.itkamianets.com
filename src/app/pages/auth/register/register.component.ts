import { Component, inject, signal } from '@angular/core';
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
import { AuthService } from '../../../services/auth.service';

const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
	const password = control.get('password')?.value;
	const confirmPassword = control.get('confirmPassword')?.value;

	if (!password || !confirmPassword) {
		return null;
	}

	return password === confirmPassword ? null : { passwordMismatch: true };
};

@Component({
	selector: 'app-register',
	imports: [ReactiveFormsModule, RouterLink],
	templateUrl: './register.component.html',
})
export class RegisterComponent {
	private readonly _authService = inject(AuthService);
	private readonly _router = inject(Router);
	private readonly _route = inject(ActivatedRoute);

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

	protected readonly isLoading = signal(false);
	protected readonly isGoogleLoading = signal(false);
	protected readonly errorMessage = signal<string | null>(null);
	protected readonly successMessage = signal<string | null>(null);
	protected readonly showPassword = signal(false);

	protected togglePasswordVisibility(): void {
		this.showPassword.update((visible) => !visible);
	}

	protected async onSubmit(): Promise<void> {
		if (this.registerForm.invalid) {
			this.registerForm.markAllAsTouched();
			return;
		}

		this.isLoading.set(true);
		this.errorMessage.set(null);
		this.successMessage.set(null);

		const { email, password } = this.registerForm.getRawValue();

		try {
			await this._authService.signUp(email, password);
			this.successMessage.set(
				'Account created! A verification link has been sent to your email. Redirecting...',
			);
			setTimeout(async () => {
				await this._navigateAfterAuth();
			}, 1200);
		} catch (error: unknown) {
			this.errorMessage.set(this._parseFirebaseError(error));
		} finally {
			this.isLoading.set(false);
		}
	}

	protected async onGoogleSignIn(): Promise<void> {
		this.isGoogleLoading.set(true);
		this.errorMessage.set(null);
		this.successMessage.set(null);

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
				case 'auth/email-already-in-use':
					return 'This email is already registered. Please sign in instead.';
				case 'auth/invalid-email':
					return 'Please enter a valid email address.';
				case 'auth/weak-password':
					return 'Password is too weak. Please use at least 6 characters with mixed symbols.';
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
		return 'Failed to create account. Please try again.';
	}
}
