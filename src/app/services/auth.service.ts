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
import { doc, Firestore, serverTimestamp, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface UserProfileData {
	uid: string;
	email: string | null;
	displayName?: string | null;
	fullName?: string | null;
	photoURL?: string | null;
	emailVerified: boolean;
	authProvider: string;
	createdAt?: unknown;
	updatedAt?: unknown;
	role?: 'angler' | 'judge' | 'organizer';
}

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	private readonly _auth = inject(Auth);
	private readonly _firestore = inject(Firestore);

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
	 * Functional Google Authentication method using popup and syncs user to Cloud Firestore.
	 */
	async signInWithGoogle(): Promise<UserCredential> {
		const provider = new GoogleAuthProvider();
		const credential = await signInWithPopup(this._auth, provider);
		if (credential.user) {
			await this.syncUserToFirestore(credential.user, {
				displayName: credential.user.displayName,
				photoURL: credential.user.photoURL,
				role: 'angler',
			});
		}
		return credential;
	}

	/**
	 * Alias for signInWithGoogle.
	 */
	async loginWithGoogle(): Promise<UserCredential> {
		return this.signInWithGoogle();
	}

	/**
	 * Register a new user using email and password, send verification, and save profile in Firestore.
	 */
	async registerWithEmail(
		email: string,
		password: string,
		additionalData?: { fullName?: string; role?: 'angler' | 'judge' | 'organizer' },
	): Promise<UserCredential> {
		const credential = await createUserWithEmailAndPassword(this._auth, email, password);
		if (credential.user) {
			await sendEmailVerification(credential.user);
			await this.syncUserToFirestore(credential.user, {
				displayName: additionalData?.fullName || '',
				fullName: additionalData?.fullName || '',
				role: additionalData?.role || 'angler',
			});
		}
		return credential;
	}

	/**
	 * Alias for registerWithEmail.
	 */
	async signUp(
		email: string,
		password: string,
		additionalData?: { fullName?: string; role?: 'angler' | 'judge' | 'organizer' },
	): Promise<UserCredential> {
		return this.registerWithEmail(email, password, additionalData);
	}

	/**
	 * Alias for registerWithEmail.
	 */
	async createUserWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
		return this.registerWithEmail(email, password);
	}

	/**
	 * Sign in an existing user with email and password and touch Firestore record.
	 */
	async signInWithEmail(email: string, password: string): Promise<UserCredential> {
		const credential = await signInWithEmailAndPassword(this._auth, email, password);
		if (credential.user) {
			await this.syncUserToFirestore(credential.user);
		}
		return credential;
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
	 * Dispatch password reset email.
	 */
	async sendPasswordReset(email: string): Promise<void> {
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

	/**
	 * Synchronize user profile into Cloud Firestore at collection 'users' / 'anglers'.
	 * Target database: spotsport-64708 (default)
	 */
	async syncUserToFirestore(user: User, customData?: Record<string, unknown>): Promise<void> {
		try {
			const userDocRef = doc(this._firestore, 'users', user.uid);
			const payload: UserProfileData & Record<string, unknown> = {
				uid: user.uid,
				email: user.email,
				displayName: user.displayName || (customData?.['displayName'] as string) || (customData?.['fullName'] as string) || '',
				fullName: (customData?.['fullName'] as string) || user.displayName || '',
				photoURL: user.photoURL || '',
				emailVerified: user.emailVerified,
				authProvider: user.providerData[0]?.providerId || 'password',
				updatedAt: serverTimestamp(),
				createdAt: serverTimestamp(),
				role: (customData?.['role'] as 'angler') || 'angler',
				...customData,
			};
			await setDoc(userDocRef, payload, { merge: true });
		} catch (error) {
			console.warn('Firestore user profile sync error (ignored for offline resilience):', error);
		}
	}
}
