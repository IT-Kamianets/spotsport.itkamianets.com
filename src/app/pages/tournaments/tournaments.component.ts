import { DecimalPipe, LowerCasePipe } from '@angular/common';
import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import QRCode from 'qrcode';
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
import { CatchItem, TournamentService } from '../../services/tournament.service';
import { TranslationService } from '../../services/translation.service';

export type TournamentMainMode = 'view' | 'editor';
export type TournamentTab = 'overview' | 'participants' | 'status' | 'leaderboard';
export type TournamentDetailTab = 'overview' | 'rules' | 'participants' | 'status' | 'leaderboard' | 'moderation';
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

@Component({
	selector: 'app-tournaments',
	imports: [DecimalPipe, LowerCasePipe, ReactiveFormsModule, RouterLink],
	templateUrl: './tournaments.component.html',
})
export class TournamentsComponent {
	private readonly _route = inject(ActivatedRoute);
	private readonly _router = inject(Router);
	private readonly _firestore = inject(Firestore);
	public readonly authService = inject(AuthService);
	public readonly tournamentService = inject(TournamentService);
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

	// Selected tournament for details view
	protected readonly selectedTournament = signal<TournamentItem | null>(null);

	// Organizer verification check
	protected readonly isOrganizer = computed(() => {
		const user = this.currentUser();
		const tourn = this.selectedTournament();
		if (!user || !tourn) return false;
		const creatorId = tourn.organizerId || tourn.createdBy;
		return Boolean(creatorId && creatorId === user.uid);
	});

	// Dropdown options for tournament sections (Overview + Details + Moderation for organizers)
	protected readonly tournamentMenuOptions = computed<
		Array<{
			id: TournamentDetailTab;
			labelKey: string;
			icon: string;
		}>
	>(() => {
		const base: Array<{
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
		if (this.isOrganizer()) {
			base.push({ id: 'moderation', labelKey: 'catch.moderationTitle', icon: 'fact_check' });
		}
		return base;
	});

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

	// Stream of catches for the currently selected tournament
	protected readonly catches$ = this._route.queryParams.pipe(
		switchMap(() => {
			const tourn = this.selectedTournament();
			const tournId = tourn?.id || tourn?.title;
			if (!tournId) {
				return of([] as CatchItem[]);
			}
			return this.tournamentService.getCatches(tournId);
		}),
	);
	protected readonly catches = toSignal(this.catches$, { initialValue: [] });

	// Filtered catches for leaderboard (only approved catches, with fallback for legacy catches without status)
	protected readonly approvedCatches = computed(() => {
		return this.catches().filter((c) => c.status === 'approved' || !c.status);
	});

	// Current user's own catches (all statuses)
	protected readonly myCatches = computed(() => {
		const user = this.currentUser();
		if (!user) return [];
		return this.catches().filter((c) => c.userId === user.uid);
	});

	// Pending catches for organizer review
	protected readonly pendingCatches = computed(() => {
		return this.catches().filter((c) => c.status === 'pending');
	});

	// Leaderboard rows aggregated from approved catches
	protected readonly leaderboard = computed(() => {
		const approved = this.approvedCatches();
		const map = new Map<
			string,
			{
				userId: string;
				displayName: string;
				catches: number;
				totalLengthCm: number;
				totalWeightKg: number;
				bestLengthCm: number;
			}
		>();

		for (const c of approved) {
			const existing = map.get(c.userId);
			const weight = c.weightKg ? Number(c.weightKg) : 0;
			const length = Number(c.lengthCm) || 0;
			if (existing) {
				existing.catches += 1;
				existing.totalLengthCm += length;
				existing.totalWeightKg += weight;
				if (length > existing.bestLengthCm) {
					existing.bestLengthCm = length;
				}
			} else {
				map.set(c.userId, {
					userId: c.userId,
					displayName: c.anglerName || 'Angler',
					catches: 1,
					totalLengthCm: length,
					totalWeightKg: weight,
					bestLengthCm: length,
				});
			}
		}

		return Array.from(map.values()).sort((a, b) => {
			if (b.totalLengthCm !== a.totalLengthCm) {
				return b.totalLengthCm - a.totalLengthCm;
			}
			return b.totalWeightKg - a.totalWeightKg;
		});
	});

	// Submit Catch modal state and form
	protected readonly catchModalOpen = signal(false);
	protected readonly isSubmittingCatch = signal(false);
	protected readonly catchFeedback = signal<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

	protected readonly speciesList = computed(() => {
		const tourn = this.selectedTournament();
		if (!tourn?.targetSpecies) {
			return ['Pike', 'Perch', 'Zander', 'Carp', 'Catfish'];
		}
		return tourn.targetSpecies
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
	});

	protected readonly catchForm = new FormGroup({
		species: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
		lengthCm: new FormControl<number | null>(null, [
			Validators.required,
			Validators.min(5),
			Validators.max(300),
		]),
		weightKg: new FormControl<number | null>(null, [
			Validators.min(0.01),
			Validators.max(100),
		]),
		photoUrl: new FormControl('', { nonNullable: true }),
		notes: new FormControl('', { nonNullable: true }),
	});

	// Join state signals & computed properties
	protected readonly isJoining = signal(false);
	protected readonly joinFeedback = signal<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

	// QR / Share modal state
	protected readonly qrModalOpen = signal(false);
	protected readonly qrDataUrl = signal<string>('');
	protected readonly linkCopied = signal(false);
	protected readonly qrTournUrl = signal<string>('');
	@ViewChild('qrCanvas') private readonly _qrCanvas?: ElementRef<HTMLCanvasElement>;

	// Camera QR scanner state
	protected readonly scanModalOpen = signal(false);
	protected readonly scanError = signal<string | null>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _html5Scanner: any = null;
	private _scannerRunning = false;

	// Manual join-via-code input
	protected readonly joinCodeInput = signal('');

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
				tab === 'overview' ||
				tab === 'moderation'
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
		this.catchFeedback.set(null);
		this.catchModalOpen.set(false);
		if (tournament) {
			this.activeDetailTab.set('overview');
			this.mode.set('view');
		}
	}

	/**
	 * Extracts a tournament ID from a scanned URL or raw ID string.
	 * Handles: full https://spotsport.itkamianets.com/tournaments/<id>  or bare <id>.
	 */
	private _extractTournamentId(raw: string): string {
		const trimmed = raw.trim();
		try {
			const url = new URL(trimmed);
			const segments = url.pathname.split('/').filter(Boolean);
			const idx = segments.indexOf('tournaments');
			if (idx !== -1 && segments[idx + 1]) {
				return decodeURIComponent(segments[idx + 1]);
			}
		} catch {
			// not a URL — treat as bare ID
		}
		return trimmed;
	}

	/** Opens the camera scanner modal. */
	protected async openScanModal(): Promise<void> {
		this.scanError.set(null);
		this.scanModalOpen.set(true);
		// Give Angular time to render #qr-reader before starting scanner
		setTimeout(() => void this._startScanner(), 120);
	}

	/** Starts html5-qrcode scanner inside #qr-reader div. */
	private async _startScanner(): Promise<void> {
		if (this._scannerRunning) return;
		try {
			// Dynamic import to avoid SSR issues
			const { Html5Qrcode } = await import('html5-qrcode');
			this._html5Scanner = new Html5Qrcode('qr-reader');
			await this._html5Scanner.start(
				{ facingMode: 'environment' },
				{ fps: 10, qrbox: { width: 220, height: 220 } },
				(decodedText: string) => {
					void this._onScanSuccess(decodedText);
				},
				() => { /* ignore frequent not-found errors */ },
			);
			this._scannerRunning = true;
		} catch {
			this.scanError.set(this.ts.t('tourn.scanError'));
		}
	}

	/** Called on successful QR scan. */
	private async _onScanSuccess(decodedText: string): Promise<void> {
		await this._stopScanner();
		this.scanModalOpen.set(false);
		const id = this._extractTournamentId(decodedText);
		if (id) {
			void this._router.navigate(['/tournaments'], { queryParams: { id } });
		}
	}

	/** Stops the camera stream and cleans up. */
	private async _stopScanner(): Promise<void> {
		if (this._scannerRunning && this._html5Scanner) {
			try {
				await this._html5Scanner.stop();
				this._html5Scanner.clear();
			} catch { /* already stopped */ }
			this._scannerRunning = false;
		}
	}

	/** Closes the scanner modal and stops camera. */
	protected async closeScanModal(): Promise<void> {
		await this._stopScanner();
		this.scanModalOpen.set(false);
		this.scanError.set(null);
	}

	/** Navigates to a tournament from the manual code/URL input. */
	protected navigateViaCode(): void {
		const raw = this.joinCodeInput();
		if (!raw.trim()) return;
		const id = this._extractTournamentId(raw);
		if (id) {
			this.joinCodeInput.set('');
			void this._router.navigate(['/tournaments'], { queryParams: { id } });
		}
	}

	/**
	 * Opens the QR / Share modal and generates a QR code data URL for the current tournament.
	 */
	protected async openQrModal(): Promise<void> {
		const tourn = this.selectedTournament();
		const tournId = tourn?.id || tourn?.title || '';
		const url = `https://spotsport.itkamianets.com/tournaments/${encodeURIComponent(tournId)}`;
		this.qrTournUrl.set(url);
		this.linkCopied.set(false);
		try {
			const dataUrl = await QRCode.toDataURL(url, {
				width: 240,
				margin: 2,
				color: { dark: '#000000', light: '#ffffff' },
			});
			this.qrDataUrl.set(dataUrl);
		} catch {
			this.qrDataUrl.set('');
		}
		this.qrModalOpen.set(true);
	}

	/** Copies the tournament URL to the clipboard and shows a brief confirmation. */
	protected copyTournLink(): void {
		const url = this.qrTournUrl();
		if (!url) return;
		navigator.clipboard.writeText(url).then(() => {
			this.linkCopied.set(true);
			setTimeout(() => this.linkCopied.set(false), 2000);
		});
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

	/**
	 * Opens the Submit Catch modal, pre-filling the first target species if available.
	 */
	protected openCatchModal(): void {
		const user = this.currentUser();
		if (!user) {
			this.joinFeedback.set({
				type: 'info',
				message: this.ts.t('catch.authRequired'),
			});
			return;
		}

		const species = this.speciesList();
		this.catchForm.reset({
			species: species.length > 0 ? species[0] : '',
			lengthCm: null,
			weightKg: null,
			photoUrl: '',
			notes: '',
		});
		this.catchFeedback.set(null);
		this.catchModalOpen.set(true);
	}

	/**
	 * Closes the Submit Catch modal.
	 */
	protected closeCatchModal(): void {
		this.catchModalOpen.set(false);
	}

	/**
	 * Submits the catch form data to Cloud Firestore via TournamentService.
	 */
	protected async submitCatch(): Promise<void> {
		if (this.catchForm.invalid) {
			this.catchForm.markAllAsTouched();
			return;
		}

		const user = this.currentUser();
		const tourn = this.selectedTournament();
		if (!user || !tourn) {
			this.catchFeedback.set({
				type: 'error',
				message: this.ts.t('catch.authRequired'),
			});
			return;
		}

		const tournId = tourn.id || tourn.title;
		const values = this.catchForm.getRawValue();

		this.isSubmittingCatch.set(true);
		this.catchFeedback.set(null);

		try {
			await this.tournamentService.submitCatch({
				tournamentId: tournId,
				userId: user.uid,
				anglerName: user.displayName || user.email?.split('@')[0] || 'Angler',
				species: values.species,
				lengthCm: Number(values.lengthCm),
				weightKg: values.weightKg ? Number(values.weightKg) : null,
				photoUrl: values.photoUrl.trim() || null,
				notes: values.notes.trim() || null,
			});

			this.catchFeedback.set({
				type: 'success',
				message: this.ts.t('catch.successMessage'),
			});
			this.catchForm.reset();

			// Auto-close modal after brief success feedback
			setTimeout(() => {
				this.catchModalOpen.set(false);
				this.catchFeedback.set(null);
			}, 1200);
		} catch (err: unknown) {
			console.error('Error submitting catch to Firestore:', err);
			this.catchFeedback.set({
				type: 'error',
				message: this.ts.t('catch.errorMessage'),
			});
		} finally {
			this.isSubmittingCatch.set(false);
		}
	}

	// Catch status update in moderation
	protected readonly updatingCatchId = signal<string | null>(null);

	/**
	 * Allows an organizer to approve or reject a submitted catch.
	 */
	protected async setCatchStatus(c: CatchItem, status: 'approved' | 'rejected'): Promise<void> {
		if (!c.id || !c.tournamentId) return;
		this.updatingCatchId.set(c.id);
		try {
			await this.tournamentService.updateCatchStatus(c.tournamentId, c.id, status);
		} catch (err: unknown) {
			console.error('Error updating catch status:', err);
		} finally {
			this.updatingCatchId.set(null);
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
			const user = this.currentUser();
			const payload: TournamentItem = {
				title: formValues.title.trim(),
				description: formValues.description.trim(),
				hostClub: formValues.hostClub.trim(),
				waterBody: formValues.waterBody.trim(),
				targetSpecies: formValues.targetSpecies.trim(),
				date: formValues.date,
				rules: formValues.rules.trim(),
				status: 'active',
				createdBy: user ? user.uid : null,
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
