import { inject, Injectable } from '@angular/core';
import {
	Auth,
	authState,
	createUserWithEmailAndPassword,
	GoogleAuthProvider,
	sendEmailVerification,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signInWithPopup,
	signOut,
	User,
	UserCredential,
} from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	private readonly _auth = inject(Auth);

	/**
	 * Observable stream tracking the current authentication state.
	 */
	readonly authState$: Observable<User | null> = authState(this._auth);
	readonly authState: Observable<User | null> = this.authState$;

	/**
	 * Current synchronous user snapshot from Firebase Auth.
	 */
	get currentUser(): User | null {
		return this._auth.currentUser;
	}

	/**
	 * Sign in using Google with popup.
	 */
	async signInWithGoogle(): Promise<UserCredential> {
		const provider = new GoogleAuthProvider();
		return signInWithPopup(this._auth, provider);
	}

	/**
	 * Alias for signInWithGoogle.
	 */
	async loginWithGoogle(): Promise<UserCredential> {
		return this.signInWithGoogle();
	}

	/**
	 * Register a new user using email and password and dispatch an email verification.
	 */
	async registerWithEmail(email: string, password: string): Promise<UserCredential> {
		const credential = await createUserWithEmailAndPassword(this._auth, email, password);
		if (credential.user) {
			await sendEmailVerification(credential.user);
		}
		return credential;
	}

	/**
	 * Alias for registerWithEmail.
	 */
	async signUp(email: string, password: string): Promise<UserCredential> {
		return this.registerWithEmail(email, password);
	}

	/**
	 * Alias for registerWithEmail.
	 */
	async createUserWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
		return this.registerWithEmail(email, password);
	}

	/**
	 * Sign in an existing user with email and password.
	 */
	async signInWithEmail(email: string, password: string): Promise<UserCredential> {
		return signInWithEmailAndPassword(this._auth, email, password);
	}

	/**
	 * Alias for signInWithEmail.
	 */
	async signIn(email: string, password: string): Promise<UserCredential> {
		return this.signInWithEmail(email, password);
	}

	/**
	 * Alias for signInWithEmail.
	 */
	async signInWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
		return this.signInWithEmail(email, password);
	}

	/**
	 * Send password reset email.
	 */
	async resetPassword(email: string): Promise<void> {
		return sendPasswordResetEmail(this._auth, email);
	}

	/**
	 * Sign out the currently authenticated user.
	 */
	async signOut(): Promise<void> {
		return signOut(this._auth);
	}

	/**
	 * Alias for signOut.
	 */
	async logout(): Promise<void> {
		return this.signOut();
	}
}
