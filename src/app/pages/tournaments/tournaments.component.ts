import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
	addDoc,
	collection,
	collectionData,
	doc,
	Firestore,
	serverTimestamp,
	setDoc,
} from '@angular/fire/firestore';
import { catchError, Observable, of, switchMap } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';

export type TournamentMainMode = 'view' | 'editor';
export type TournamentTab = 'overview' | 'participants' | 'status' | 'leaderboard';
export type TournamentDetailTab = 'overview' | 'rules' | 'participants' | 'status' | 'leaderboard';
export type EditorSection = 'general' | 'schedule' | 'scoring' | 'penalties';

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

@Component({
	selector: 'app-tournaments',
	imports: [ReactiveFormsModule, RouterLink],
	templateUrl: './tournaments.component.html',
})
export class TournamentsComponent {
	private readonly _route = inject(ActivatedRoute);
	private readonly _firestore = inject(Firestore);
	public readonly authService = inject(AuthService);
	public readonly ts = inject(TranslationService);

	// Current authenticated user signal
	protected readonly currentUser = toSignal(this.authService.authState$, {
		initialValue: this.authService.currentUser,
	});

	// Navigation & view signals
	protected readonly mode = signal<TournamentMainMode>('view');
	protected readonly activeTab = signal<TournamentTab>('overview');
	protected readonly activeDetailTab = signal<TournamentDetailTab>('overview');
	protected readonly activeSection = signal<EditorSection>('general');
	protected readonly settingsMenuOpen = signal(false);

	// Dropdown options for tournament sections (Overview + Details)
	protected readonly tournamentMenuOptions: Array<{
		id: TournamentDetailTab;
		labelKey: string;
		icon: string;
	}> = [
		{ id: 'overview', labelKey: 'tourn.subtabOverview', icon: 'info' },
		{ id: 'rules', labelKey: 'tourn.subtabRules', icon: 'gavel' },
		{ id: 'participants', labelKey: 'tourn.subtabParticipants', icon: 'groups' },
		{ id: 'status', labelKey: 'tourn.subtabStatus', icon: 'schedule' },
		{ id: 'leaderboard', labelKey: 'tourn.subtabLeaderboard', icon: 'leaderboard' },
	];

	// Selected tournament for details view
	protected readonly selectedTournament = signal<TournamentItem | null>(null);

	// Firestore collection & data stream for tournaments
	private readonly _tournamentsCol = collection(this._firestore, 'tournaments');
	protected readonly tournaments$: Observable<TournamentItem[]> = (
		collectionData(this._tournamentsCol, { idField: 'id' }) as Observable<TournamentItem[]>
	).pipe(
		catchError((err) => {
			console.warn('Firestore tournaments fetch notice:', err);
			return of([]);
		}),
	);
	protected readonly tournaments = toSignal(this.tournaments$, { initialValue: [] });

	// Stream of participants for the currently selected tournament
	protected readonly participants$ = this._route.queryParams.pipe(
		switchMap(() => {
			const tourn = this.selectedTournament();
			const tournId = tourn?.id || tourn?.title;
			if (!tournId) {
				return of([] as ParticipantItem[]);
			}
			const subCol = collection(this._firestore, 'tournaments', tournId, 'participants');
			return (collectionData(subCol, { idField: 'id' }) as Observable<ParticipantItem[]>).pipe(
				catchError((err) => {
					console.warn('Firestore participants fetch notice:', err);
					return of([] as ParticipantItem[]);
				}),
			);
		}),
	);
	protected readonly participants = toSignal(this.participants$, { initialValue: [] });

	// Join state signals & computed properties
	protected readonly isJoining = signal(false);
	protected readonly joinFeedback = signal<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

	protected readonly isUserRegistered = computed(() => {
		const user = this.currentUser();
		if (!user) return false;
		return this.participants().some((p) => p.userId === user.uid || (user.email && p.email === user.email));
	});

	// Form & state signals
	protected readonly isSaving = signal(false);
	protected readonly saveError = signal<string | null>(null);
	protected readonly saveSuccess = signal<string | null>(null);

	protected readonly tournamentForm = new FormGroup({
		title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
		description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
		hostClub: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
		waterBody: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
		targetSpecies: new FormControl('Pike, Perch, Zander', {
			nonNullable: true,
			validators: [Validators.required],
		}),
		date: new FormControl(new Date().toISOString().slice(0, 10), {
			nonNullable: true,
			validators: [Validators.required],
		}),
		rules: new FormControl(
			'Catch-Photo-Release (CPR) format. Verified length on official SpotSport ruler. Catch and release alive.',
			{ nonNullable: true, validators: [Validators.required] },
		),
	});

	constructor() {
		this._route.queryParams.subscribe((params) => {
			const tab = params['tab'];
			const mode = params['mode'];
			const tournamentId = params['tournamentId'] || params['id'];

			if (mode === 'editor' || tab === 'editor') {
				this.mode.set('editor');
				this.selectedTournament.set(null);
			} else if (mode === 'view') {
				this.mode.set('view');
			}

			if (tournamentId) {
				const found = this.tournaments().find((t) => t.id === tournamentId);
				if (found) {
					this.selectedTournament.set(found);
				}
			}

			if (
				tab === 'overview' ||
				tab === 'participants' ||
				tab === 'status' ||
				tab === 'leaderboard'
			) {
				this.activeTab.set(tab as TournamentTab);
			}

			if (
				tab === 'rules' ||
				tab === 'participants' ||
				tab === 'status' ||
				tab === 'leaderboard' ||
				tab === 'overview'
			) {
				this.activeDetailTab.set(tab as TournamentDetailTab);
			} else if (
				tab === 'general' ||
				tab === 'schedule' ||
				tab === 'scoring' ||
				tab === 'penalties'
			) {
				this.mode.set('editor');
				this.activeSection.set(tab);
			}
		});
	}

	protected setMode(mode: TournamentMainMode): void {
		this.mode.set(mode);
		if (mode === 'editor') {
			this.selectedTournament.set(null);
		}
		this.settingsMenuOpen.set(false);
		this.saveError.set(null);
		this.saveSuccess.set(null);
	}

	protected setTab(tab: TournamentTab): void {
		this.activeTab.set(tab);
	}

	protected setDetailTab(tab: TournamentDetailTab): void {
		this.activeDetailTab.set(tab);
	}

	protected toggleSettingsMenu(): void {
		this.settingsMenuOpen.update((open) => !open);
	}

	protected selectSection(tab: TournamentDetailTab): void {
		this.activeDetailTab.set(tab);
		this.settingsMenuOpen.set(false);
	}

	protected setSection(section: EditorSection): void {
		this.activeSection.set(section);
	}

	protected selectTournament(tournament: TournamentItem | null): void {
		this.selectedTournament.set(tournament);
		this.settingsMenuOpen.set(false);
		this.joinFeedback.set(null);
		if (tournament) {
			this.activeDetailTab.set('overview');
			this.mode.set('view');
		}
	}

	/**
	 * Allows an authenticated angler to join the selected tournament in Cloud Firestore.
	 */
	protected async joinTournament(): Promise<void> {
		const user = this.currentUser();
		const tourn = this.selectedTournament();

		if (!user) {
			this.joinFeedback.set({
				type: 'info',
				message: this.ts.t('tourn.authRequiredToJoin'),
			});
			return;
		}

		if (!tourn) {
			return;
		}

		const tournId = tourn.id || tourn.title;
		if (this.isUserRegistered()) {
			this.joinFeedback.set({
				type: 'info',
				message: this.ts.t('tourn.alreadyRegistered'),
			});
			return;
		}

		this.isJoining.set(true);
		this.joinFeedback.set(null);

		try {
			const participantRef = doc(this._firestore, 'tournaments', tournId, 'participants', user.uid);
			const payload: ParticipantItem = {
				userId: user.uid,
				email: user.email,
				displayName: user.displayName || user.email?.split('@')[0] || 'Angler',
				tournamentId: tournId,
				joinedAt: serverTimestamp(),
			};

			await setDoc(participantRef, payload, { merge: true });
			this.joinFeedback.set({
				type: 'success',
				message: this.ts.t('tourn.joinSuccess'),
			});
		} catch (err: unknown) {
			console.error('Error joining tournament:', err);
			this.joinFeedback.set({
				type: 'error',
				message: this.ts.t('tourn.joinError'),
			});
		} finally {
			this.isJoining.set(false);
		}
	}

	protected async saveTournament(): Promise<void> {
		if (this.tournamentForm.invalid) {
			this.tournamentForm.markAllAsTouched();
			return;
		}

		this.isSaving.set(true);
		this.saveError.set(null);
		this.saveSuccess.set(null);

		try {
			const formValues = this.tournamentForm.getRawValue();
			const payload: TournamentItem = {
				title: formValues.title.trim(),
				description: formValues.description.trim(),
				hostClub: formValues.hostClub.trim(),
				waterBody: formValues.waterBody.trim(),
				targetSpecies: formValues.targetSpecies.trim(),
				date: formValues.date,
				rules: formValues.rules.trim(),
				status: 'active',
				createdAt: serverTimestamp(),
			};

			const docRef = await addDoc(this._tournamentsCol, payload);
			this.saveSuccess.set(`Tournament "${payload.title}" created successfully!`);

			this.tournamentForm.reset({
				title: '',
				description: '',
				hostClub: '',
				waterBody: '',
				targetSpecies: 'Pike, Perch, Zander',
				date: new Date().toISOString().slice(0, 10),
				rules: 'Catch-Photo-Release (CPR) format. Verified length on official SpotSport ruler. Catch and release alive.',
			});

			setTimeout(() => {
				this.mode.set('view');
				this.selectedTournament.set({ ...payload, id: docRef.id });
				this.activeDetailTab.set('overview');
				this.saveSuccess.set(null);
			}, 800);
		} catch (err: unknown) {
			console.error('Error saving tournament to Firestore:', err);
			this.saveError.set(
				'Failed to save tournament to Cloud Firestore. Please check network connection and database permissions.',
			);
		} finally {
			this.isSaving.set(false);
		}
	}
}
