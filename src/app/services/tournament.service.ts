import { inject, Injectable } from '@angular/core';
import {
	addDoc,
	collection,
	collectionData,
	doc,
	Firestore,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	updateDoc,
} from '@angular/fire/firestore';
import { catchError, Observable, of } from 'rxjs';

export interface CatchItem {
	id?: string;
	tournamentId: string;
	userId: string;
	anglerName?: string | null;
	species: string;
	lengthCm: number;
	weightKg?: number | null;
	photoUrl?: string | null;
	notes?: string | null;
	status?: 'pending' | 'approved' | 'rejected';
	submittedAt?: unknown;
	createdAt?: unknown;
}

export interface CatchSubmissionPayload {
	tournamentId: string;
	userId: string;
	anglerName?: string | null;
	species: string;
	lengthCm: number;
	weightKg?: number | null;
	photoUrl?: string | null;
	notes?: string | null;
}

export interface TournamentItem {
	id?: string;
	title: string;
	description: string;
	hostClub: string;
	waterBody: string;
	targetSpecies: string;
	date: string;
	rules: string;
	status?: 'active' | 'upcoming' | 'completed';
	createdBy?: string | null;
	organizerId?: string | null;
	createdAt?: unknown;
}

export interface ParticipantItem {
	id?: string;
	userId: string;
	email: string | null;
	displayName?: string | null;
	tournamentId: string;
	joinedAt?: unknown;
}

@Injectable({
	providedIn: 'root',
})
export class TournamentService {
	private readonly _firestore = inject(Firestore);

	/**
	 * Get an observable stream of all tournaments.
	 */
	getTournaments(): Observable<TournamentItem[]> {
		const tournamentsCol = collection(this._firestore, 'tournaments');
		return (collectionData(tournamentsCol, { idField: 'id' }) as Observable<TournamentItem[]>).pipe(
			catchError((err) => {
				console.warn('Firestore tournaments fetch error:', err);
				return of([]);
			}),
		);
	}

	/**
	 * Get real-time participants stream for a given tournament.
	 */
	getParticipants(tournamentId: string): Observable<ParticipantItem[]> {
		if (!tournamentId) return of([]);
		const participantsCol = collection(this._firestore, 'tournaments', tournamentId, 'participants');
		return (collectionData(participantsCol, { idField: 'id' }) as Observable<ParticipantItem[]>).pipe(
			catchError((err) => {
				console.warn('Firestore participants fetch error:', err);
				return of([]);
			}),
		);
	}

	/**
	 * Get real-time catches stream for a tournament (ordered by timestamp).
	 */
	getCatches(tournamentId: string): Observable<CatchItem[]> {
		if (!tournamentId) return of([]);
		const catchesCol = collection(this._firestore, 'tournaments', tournamentId, 'catches');
		const catchesQuery = query(catchesCol, orderBy('submittedAt', 'desc'));
		return (collectionData(catchesQuery, { idField: 'id' }) as Observable<CatchItem[]>).pipe(
			catchError((err) => {
				console.warn('Firestore catches query fallback to unordered collection:', err);
				return (collectionData(catchesCol, { idField: 'id' }) as Observable<CatchItem[]>).pipe(
					catchError((fallbackErr) => {
						console.warn('Firestore catches fetch error:', fallbackErr);
						return of([]);
					}),
				);
			}),
		);
	}

	/**
	 * Register an authenticated user as a participant in a tournament.
	 */
	async joinTournament(
		tournamentId: string,
		user: { uid: string; email: string | null; displayName?: string | null },
	): Promise<void> {
		const participantRef = doc(this._firestore, 'tournaments', tournamentId, 'participants', user.uid);
		const payload: ParticipantItem = {
			userId: user.uid,
			email: user.email,
			displayName: user.displayName || user.email?.split('@')[0] || 'Angler',
			tournamentId,
			joinedAt: serverTimestamp(),
		};
		await setDoc(participantRef, payload, { merge: true });
	}

	/**
	 * Submit a catch to Cloud Firestore linked to tournamentId, user uid, angler display name,
	 * fish species, weight/length, optional photo URL, optional notes, and server timestamp.
	 * Writes to `/tournaments/{tournamentId}/catches` subcollection.
	 */
	async submitCatch(data: CatchSubmissionPayload): Promise<string> {
		if (!data.tournamentId) {
			throw new Error('Tournament ID is required to submit a catch.');
		}
		if (!data.userId) {
			throw new Error('Authenticated User ID is required to submit a catch.');
		}

		const catchesCol = collection(this._firestore, 'tournaments', data.tournamentId, 'catches');
		const catchDoc: Omit<CatchItem, 'id'> = {
			tournamentId: data.tournamentId,
			userId: data.userId,
			anglerName: data.anglerName?.trim() || 'Angler',
			species: data.species.trim(),
			lengthCm: Number(data.lengthCm),
			weightKg: data.weightKg != null && !isNaN(Number(data.weightKg)) ? Number(data.weightKg) : null,
			photoUrl: data.photoUrl?.trim() || null,
			notes: data.notes?.trim() || null,
			status: 'pending',
			submittedAt: serverTimestamp(),
			createdAt: serverTimestamp(),
		};

		const docRef = await addDoc(catchesCol, catchDoc);
		return docRef.id;
	}

	/**
	 * Update the verification status of a catch ('approved' | 'rejected') in Cloud Firestore.
	 */
	async updateCatchStatus(
		tournamentId: string,
		catchId: string,
		status: 'approved' | 'rejected',
	): Promise<void> {
		if (!tournamentId || !catchId) {
			throw new Error('Tournament ID and Catch ID are required to update catch status.');
		}
		const catchRef = doc(this._firestore, 'tournaments', tournamentId, 'catches', catchId);
		await updateDoc(catchRef, {
			status,
			reviewedAt: serverTimestamp(),
		});
	}
}
