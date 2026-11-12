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
import {
	doc,
	docData,
	Firestore,
	getDoc,
	serverTimestamp,
	setDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface UserProfile {
	uid: string;
	email: string;
	displayName: string;
	photoURL: string;
	role: 'angler' | 'judge' | 'admin';
	providerId: string;
	createdAt?: unknown;
	lastLoginAt?: unknown;
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
	 * Sign in using Google with popup and sync profile to Firestore database.
	 */
	async signInWithGoogle(): Promise<UserCredential> {
		const provider = new GoogleAuthProvider();
		provider.setCustomParameters({ prompt: 'select_account' });
		const credential = await signInWithPopup(this._auth, provider);
		if (credential.user) {
			await this.syncUserToFirestore(credential.user);
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
	 * Register a new user using email and password, dispatch verification, and store in Firestore.
	 */
	async registerWithEmail(email: string, password: string): Promise<UserCredential> {
		const credential = await createUserWithEmailAndPassword(this._auth, email, password);
		if (credential.user) {
			await sendEmailVerification(credential.user);
			await this.syncUserToFirestore(credential.user);
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
	 * Sign in an existing user with email and password and sync Firestore.
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
	 * Send password reset email instructions.
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

	/**
	 * Synchronize user profile into Firestore collection `users` at document `users/{uid}`.
	 */
	async syncUserToFirestore(user: User): Promise<void> {
		try {
			const userRef = doc(this._firestore, 'users', user.uid);
			const userSnap = await getDoc(userRef);

			if (!userSnap.exists()) {
				await setDoc(userRef, {
					uid: user.uid,
					email: user.email ?? '',
					displayName: user.displayName ?? '',
					photoURL: user.photoURL ?? '',
					providerId: user.providerData?.[0]?.providerId ?? 'google.com',
					role: 'angler',
					createdAt: serverTimestamp(),
					lastLoginAt: serverTimestamp(),
				});
			} else {
				await setDoc(
					userRef,
					{
						lastLoginAt: serverTimestamp(),
						email: user.email ?? userSnap.data()['email'] ?? '',
						displayName: user.displayName ?? userSnap.data()['displayName'] ?? '',
						photoURL: user.photoURL ?? userSnap.data()['photoURL'] ?? '',
					},
					{ merge: true },
				);
			}
		} catch (err) {
			console.warn('Firestore user profile sync notice:', err);
		}
	}

	/**
	 * Stream Firestore user profile data by UID.
	 */
	getUserProfile(uid: string): Observable<UserProfile | undefined> {
		const userRef = doc(this._firestore, 'users', uid);
		return docData(userRef) as Observable<UserProfile | undefined>;
	}
}
