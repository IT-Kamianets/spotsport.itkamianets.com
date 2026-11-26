import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import {
	CatchItem,
	formatCatchTime,
	ParticipantItem,
	PenaltyItem,
	PenaltySeverity,
	TournamentItem,
	TournamentService,
} from '../../services/tournament.service';
import { TranslationService } from '../../services/translation.service';
import { ScrollService } from '../../services/scroll.service';

export type RefereeingMode = 'catch' | 'judging';
export type CatchTab = 'status' | 'offline';
export type JudgingTab = 'review' | 'penalties' | 'leaderboard';

@Component({
	selector: 'app-refereeing',
	imports: [DecimalPipe, ReactiveFormsModule],
	templateUrl: './refereeing.component.html',
})
export class RefereeingComponent {
	private readonly _route = inject(ActivatedRoute);
	private readonly _platformId = inject(PLATFORM_ID);
	private readonly _isBrowser = isPlatformBrowser(this._platformId);
	public readonly authService = inject(AuthService);
	public readonly tournamentService = inject(TournamentService);
	public readonly ts = inject(TranslationService);
	private readonly _scrollService = inject(ScrollService);

	// Online status signal
	protected readonly isOnline = signal<boolean>(this._isBrowser ? navigator.onLine : true);
	protected readonly isRefreshing = signal<boolean>(false);
	protected readonly lastSyncedAt = signal<string | null>(null);

	// Current authenticated user
	protected readonly currentUser = toSignal(this.authService.authState$, {
		initialValue: this.authService.currentUser,
	});

	// Active tournament query param
	protected readonly activeTournamentId = signal<string | null>(null);

	// Tournaments list
	protected readonly tournaments$ = this.tournamentService.getTournaments();
	protected readonly tournaments = toSignal(this.tournaments$, { initialValue: [] });

	// Selected tournament
	protected readonly selectedTournament = computed<TournamentItem | null>(() => {
		const id = this.activeTournamentId();
		const list = this.tournaments();
		if (!id || list.length === 0) {
			return list[0] || null;
		}
		return list.find((t) => t.id === id || t.title === id) || list[0] || null;
	});

	// Organizer verification check
	protected readonly isOrganizer = computed(() => {
		const user = this.currentUser();
		const tourn = this.selectedTournament();
		if (!user || !tourn) return false;
		const creatorId = tourn.organizerId || tourn.createdBy;
		return Boolean(creatorId && creatorId === user.uid);
	});

	// Registered participants for selected tournament
	protected readonly participants$ = toObservable(this.selectedTournament).pipe(
		switchMap((tourn) => {
			const tid = tourn?.id || tourn?.title;
			if (!tid) return of([] as ParticipantItem[]);
			return this.tournamentService.getParticipants(tid);
		}),
	);
	protected readonly participants = toSignal(this.participants$, { initialValue: [] });

	// Penalties stream for selected tournament
	protected readonly penalties$ = toObservable(this.selectedTournament).pipe(
		switchMap((tourn) => {
			const tid = tourn?.id || tourn?.title;
			if (!tid) return of([] as PenaltyItem[]);
			return this.tournamentService.getPenalties(tid);
		}),
	);
	protected readonly penalties = toSignal(this.penalties$, { initialValue: [] });

	// Penalty Form
	protected readonly penaltyForm = new FormGroup({
		userId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
		severity: new FormControl<PenaltySeverity>('warning', { nonNullable: true, validators: [Validators.required] }),
		pointsDeducted: new FormControl<number | null>(null),
		reason: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
	});

	protected readonly isAddingPenalty = signal(false);
	protected readonly penaltyError = signal<string | null>(null);
	protected readonly deletingPenaltyId = signal<string | null>(null);

	// Catches for the selected tournament
	protected readonly catches$ = toObservable(this.selectedTournament).pipe(
		switchMap((tourn) => {
			const tid = tourn?.id || tourn?.title;
			if (!tid) return of([] as CatchItem[]);
			return this.tournamentService.getCatches(tid);
		}),
	);
	protected readonly catches = toSignal(this.catches$, { initialValue: [] });

	// Pending catches for review
	protected readonly pendingCatches = computed(() => {
		return this.catches().filter((c) => c.status === 'pending');
	});

	// Current user's submitted catches for status tracker
	protected readonly myCatches = computed(() => {
		const user = this.currentUser();
		if (!user) return [];
		return this.catches().filter((c) => c.userId === user.uid);
	});

	// Filtered catches for live standings monitor
	protected readonly approvedCatches = computed(() => {
		return this.catches().filter((c) => c.status === 'approved' || !c.status);
	});

	protected readonly rejectedCatches = computed(() => {
		return this.catches().filter((c) => c.status === 'rejected');
	});

	// Live leaderboard standings aggregated from approved catches
	protected readonly liveStandings = computed(() => {
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
			if (b.totalWeightKg !== a.totalWeightKg) {
				return b.totalWeightKg - a.totalWeightKg;
			}
			if (b.totalLengthCm !== a.totalLengthCm) {
				return b.totalLengthCm - a.totalLengthCm;
			}
			return b.bestLengthCm - a.bestLengthCm;
		});
	});

	// Prioritized catches for review queue: pending first, then others by submittedAt
	protected readonly reviewCatches = computed(() => {
		const list = [...this.catches()];
		const getTime = (val: unknown): number => {
			if (!val) return 0;
			if (typeof val === 'string' || typeof val === 'number') {
				const d = new Date(val).getTime();
				return isNaN(d) ? 0 : d;
			}
			if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
				return (val as { toDate: () => Date }).toDate().getTime();
			}
			return 0;
		};

		return list.sort((a, b) => {
			if (a.status === 'pending' && b.status !== 'pending') return -1;
			if (a.status !== 'pending' && b.status === 'pending') return 1;
			const timeA = getTime(a.submittedAt || a.createdAt);
			const timeB = getTime(b.submittedAt || b.createdAt);
			return timeB - timeA;
		});
	});

	protected readonly updatingCatchId = signal<string | null>(null);

	protected readonly mode = signal<RefereeingMode>('catch');
	protected readonly activeCatchTab = signal<CatchTab>('status');
	protected readonly activeJudgingTab = signal<JudgingTab>('review');
	protected readonly showCatchDetailsDialog = signal(false);

	constructor() {
		if (this._isBrowser) {
			window.addEventListener('online', () => this.isOnline.set(true));
			window.addEventListener('offline', () => this.isOnline.set(false));
		}

		this._route.queryParams.subscribe((params) => {
			const mode = params['mode'];
			const tab = params['tab'];
			const tournamentId = params['tournamentId'];

			if (tournamentId) {
				this.activeTournamentId.set(tournamentId);
			}

			if (mode === 'judging' || tab === 'judging' || tab === 'review' || tab === 'penalties' || tab === 'leaderboard') {
				this.mode.set('judging');
				if (tab === 'review' || tab === 'penalties' || tab === 'leaderboard') {
					this.activeJudgingTab.set(tab);
				}
			} else if (mode === 'catch' || tab === 'catch' || tab === 'submit' || tab === 'status' || tab === 'offline') {
				this.mode.set('catch');
				if (tab === 'status' || tab === 'offline') {
					this.activeCatchTab.set(tab);
				} else {
					this.activeCatchTab.set('status');
				}
			}
		});
	}

	protected setMode(mode: RefereeingMode): void {
		this.mode.set(mode);
		this._scrollService.scrollToTop();
	}

	protected setCatchTab(tab: CatchTab): void {
		this.activeCatchTab.set(tab);
		this._scrollService.scrollToTop();
	}

	protected setJudgingTab(tab: JudgingTab): void {
		this.activeJudgingTab.set(tab);
		this._scrollService.scrollToTop();
	}

	protected toggleCatchDetails(): void {
		this.showCatchDetailsDialog.update((v) => !v);
	}

	protected onSelectTournament(t: TournamentItem): void {
		this.activeTournamentId.set(t.id || t.title);
		this._scrollService.scrollToTop();
	}

	protected formatCatchTime(val: unknown): string {
		return formatCatchTime(val);
	}

	/**
	 * Trigger a soft refresh / sync state check.
	 */
	protected syncQueue(): void {
		this.isRefreshing.set(true);
		if (this._isBrowser) {
			this.isOnline.set(navigator.onLine);
		}
		setTimeout(() => {
			this.lastSyncedAt.set(new Date().toLocaleTimeString());
			this.isRefreshing.set(false);
		}, 600);
	}

	/**
	 * Allows an organizer to add a penalty for a participant.
	 */
	protected async addPenalty(): Promise<void> {
		if (this.penaltyForm.invalid) {
			this.penaltyForm.markAllAsTouched();
			return;
		}

		const tourn = this.selectedTournament();
		const tournId = tourn?.id || tourn?.title;
		const user = this.currentUser();
		if (!tournId || !user) return;

		const values = this.penaltyForm.getRawValue();
		const part = this.participants().find((p) => p.userId === values.userId);

		this.isAddingPenalty.set(true);
		this.penaltyError.set(null);

		try {
			await this.tournamentService.addPenalty(tournId, {
				userId: values.userId,
				anglerName: part?.displayName || part?.email?.split('@')[0] || 'Angler',
				severity: values.severity,
				pointsDeducted: values.pointsDeducted ? Number(values.pointsDeducted) : null,
				reason: values.reason.trim(),
				issuedBy: user.displayName || user.email || user.uid,
			});

			this.penaltyForm.reset({
				userId: '',
				severity: 'warning',
				pointsDeducted: null,
				reason: '',
			});
		} catch (err: unknown) {
			console.error('Error adding penalty:', err);
			this.penaltyError.set('Failed to save penalty. Please try again.');
		} finally {
			this.isAddingPenalty.set(false);
		}
	}

	/**
	 * Allows an organizer to revoke/remove a penalty.
	 */
	protected async removePenalty(p: PenaltyItem): Promise<void> {
		const tourn = this.selectedTournament();
		const tournId = p.tournamentId || tourn?.id || tourn?.title;
		if (!tournId || !p.id) return;

		this.deletingPenaltyId.set(p.id);
		try {
			await this.tournamentService.removePenalty(tournId, p.id);
		} catch (err: unknown) {
			console.error('Error removing penalty:', err);
		} finally {
			this.deletingPenaltyId.set(null);
		}
	}

	/**
	 * Allows an organizer to approve or reject a submitted catch.
	 */
	protected async setCatchStatus(c: CatchItem, status: 'approved' | 'rejected'): Promise<void> {
		const tourn = this.selectedTournament();
		const tournId = c.tournamentId || tourn?.id || tourn?.title;
		if (!c.id || !tournId) return;
		this.updatingCatchId.set(c.id);
		try {
			await this.tournamentService.updateCatchStatus(tournId, c.id, status);
		} catch (err: unknown) {
			console.error('Error updating catch status in refereeing:', err);
		} finally {
			this.updatingCatchId.set(null);
		}
	}
}
