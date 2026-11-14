import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
	addDoc,
	collection,
	collectionData,
	Firestore,
	serverTimestamp,
} from '@angular/fire/firestore';
import { catchError, Observable, of } from 'rxjs';

export type TournamentMainMode = 'view' | 'editor';
export type TournamentTab = 'overview' | 'rules' | 'participants' | 'status' | 'leaderboard';
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

@Component({
	selector: 'app-tournaments',
	imports: [ReactiveFormsModule, RouterLink],
	templateUrl: './tournaments.component.html',
})
export class TournamentsComponent {
	private readonly _route = inject(ActivatedRoute);
	private readonly _firestore = inject(Firestore);

	// Navigation & view signals
	protected readonly mode = signal<TournamentMainMode>('view');
	protected readonly activeTab = signal<TournamentTab>('overview');
	protected readonly activeSection = signal<EditorSection>('general');

	// Selected tournament for details view
	protected readonly selectedTournament = signal<TournamentItem | null>(null);

	// Firestore collection & data stream
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
				tab === 'rules' ||
				tab === 'participants' ||
				tab === 'status' ||
				tab === 'leaderboard' ||
				tab === 'overview'
			) {
				this.activeTab.set(tab);
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
		this.saveError.set(null);
		this.saveSuccess.set(null);
	}

	protected setTab(tab: TournamentTab): void {
		this.activeTab.set(tab);
	}

	protected setSection(section: EditorSection): void {
		this.activeSection.set(section);
	}

	protected selectTournament(tournament: TournamentItem | null): void {
		this.selectedTournament.set(tournament);
		if (tournament) {
			this.activeTab.set('overview');
			this.mode.set('view');
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
				this.activeTab.set('overview');
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
