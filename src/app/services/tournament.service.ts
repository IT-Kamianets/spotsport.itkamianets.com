import { inject, Injectable } from '@angular/core';
import {
	addDoc,
	collection,
	collectionData,
	deleteDoc,
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
	weightGrams?: number | null;
	photoUrl?: string | null;
	notes?: string | null;
	status?: 'pending' | 'approved' | 'rejected';
	submittedAt?: unknown;
	createdAt?: unknown;
}

/**
 * Safely format a Firestore Timestamp, Date, string, seconds object, or number into a readable local string.
 */
export function formatCatchTime(val: unknown): string {
	if (!val) return '';
	try {
		// Firestore Timestamp instance with .toDate()
		if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
			return (val as { toDate: () => Date }).toDate().toLocaleString();
		}
		// Firestore serialized Timestamp: { seconds: number, nanoseconds?: number }
		if (typeof val === 'object' && val !== null && 'seconds' in val && typeof (val as { seconds: unknown }).seconds === 'number') {
			return new Date((val as { seconds: number }).seconds * 1000).toLocaleString();
		}
		// Date instance
		if (val instanceof Date) {
			return isNaN(val.getTime()) ? '' : val.toLocaleString();
		}
		// String or number
		if (typeof val === 'string' || typeof val === 'number') {
			const d = new Date(val);
			return isNaN(d.getTime()) ? String(val) : d.toLocaleString();
		}
		return '';
	} catch {
		return '';
	}
}

export interface CatchSubmissionPayload {
	tournamentId: string;
	userId: string;
	anglerName?: string | null;
	species: string;
	lengthCm: number;
	weightKg?: number | null;
	weightGrams?: number | null;
	photoUrl?: string | null;
	notes?: string | null;
}

export type TournamentScoringMode = 'length' | 'weight' | 'both';

export interface TournamentItem {
	id?: string;
	title: string;
	description: string;
	hostClub: string;
	waterBody: string;
	targetSpecies: string;
	date: string;
	rules: string;
	scoringMode?: TournamentScoringMode;
	roundsCount?: number;
	hasBreak?: boolean;
	breakLabel?: string | null;
	breakTime?: string | null;
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

export type PenaltySeverity = 'warning' | 'point_deduction' | 'disqualification';

export interface PenaltyItem {
	id?: string;
	tournamentId: string;
	userId: string;
	anglerName?: string | null;
	severity: PenaltySeverity;
	pointsDeducted?: number | null;
	reason: string;
	issuedBy?: string | null;
	createdAt?: unknown;
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
	 * Create a new tournament in Cloud Firestore.
	 * Automatically links `createdBy` and `organizerId` to the creator's UID.
	 */
	async createTournament(
		tournament: Omit<TournamentItem, 'id' | 'createdAt'> & { userId?: string | null },
	): Promise<string> {
		const tournamentsCol = collection(this._firestore, 'tournaments');
		const creatorUid = tournament.userId || tournament.createdBy || tournament.organizerId || null;
		const payload: Omit<TournamentItem, 'id'> = {
			title: tournament.title.trim(),
			description: tournament.description.trim(),
			hostClub: tournament.hostClub.trim(),
			waterBody: tournament.waterBody.trim(),
			targetSpecies: tournament.targetSpecies.trim(),
			date: tournament.date,
			rules: tournament.rules.trim(),
			scoringMode: tournament.scoringMode || 'length',
			roundsCount: tournament.roundsCount && tournament.roundsCount >= 1 && tournament.roundsCount <= 3 ? tournament.roundsCount : 2,
			hasBreak: tournament.hasBreak !== undefined ? Boolean(tournament.hasBreak) : true,
			breakLabel: tournament.breakLabel ? tournament.breakLabel.trim() : null,
			breakTime: tournament.breakTime ? tournament.breakTime.trim() : null,
			status: tournament.status || 'active',
			createdBy: creatorUid,
			organizerId: creatorUid,
			createdAt: serverTimestamp(),
		};

		const docRef = await addDoc(tournamentsCol, payload);
		return docRef.id;
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
		const weightKg = data.weightKg != null && !isNaN(Number(data.weightKg)) ? Number(data.weightKg) : null;
		const weightGrams = data.weightGrams != null && !isNaN(Number(data.weightGrams))
			? Number(data.weightGrams)
			: weightKg != null
				? Math.round(weightKg * 1000)
				: null;

		const catchDoc: Omit<CatchItem, 'id'> = {
			tournamentId: data.tournamentId,
			userId: data.userId,
			anglerName: data.anglerName?.trim() || 'Angler',
			species: data.species.trim(),
			lengthCm: Number(data.lengthCm),
			weightKg,
			weightGrams,
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

	/**
	 * Get real-time penalties stream for a given tournament.
	 */
	getPenalties(tournamentId: string): Observable<PenaltyItem[]> {
		if (!tournamentId) return of([]);
		const penaltiesCol = collection(this._firestore, 'tournaments', tournamentId, 'penalties');
		const penaltiesQuery = query(penaltiesCol, orderBy('createdAt', 'desc'));
		return (collectionData(penaltiesQuery, { idField: 'id' }) as Observable<PenaltyItem[]>).pipe(
			catchError((err) => {
				console.warn('Firestore penalties query fallback to unordered collection:', err);
				return (collectionData(penaltiesCol, { idField: 'id' }) as Observable<PenaltyItem[]>).pipe(
					catchError((fallbackErr) => {
						console.warn('Firestore penalties fetch error:', fallbackErr);
						return of([]);
					}),
				);
			}),
		);
	}

	/**
	 * Add a penalty for a participant in a tournament.
	 */
	async addPenalty(
		tournamentId: string,
		payload: Omit<PenaltyItem, 'id' | 'createdAt' | 'tournamentId'>,
	): Promise<string> {
		if (!tournamentId) throw new Error('Tournament ID is required to add a penalty.');
		const penaltiesCol = collection(this._firestore, 'tournaments', tournamentId, 'penalties');
		const docRef = await addDoc(penaltiesCol, {
			...payload,
			tournamentId,
			createdAt: serverTimestamp(),
		});
		return docRef.id;
	}

	/**
	 * Remove / revoke a penalty from a tournament.
	 */
	async removePenalty(tournamentId: string, penaltyId: string): Promise<void> {
		if (!tournamentId || !penaltyId) throw new Error('Tournament ID and Penalty ID are required.');
		const penaltyRef = doc(this._firestore, 'tournaments', tournamentId, 'penalties', penaltyId);
		await deleteDoc(penaltyRef);
	}
}
