import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CatchItem, formatCatchTime, TournamentItem, TournamentService } from '../../services/tournament.service';
import { TranslationService } from '../../services/translation.service';

export type RefereeingMode = 'catch' | 'judging';
export type CatchTab = 'status' | 'offline';
export type JudgingTab = 'review' | 'penalties' | 'leaderboard';

@Component({
	selector: 'app-refereeing',
	templateUrl: './refereeing.component.html',
})
export class RefereeingComponent {
	private readonly _route = inject(ActivatedRoute);
	public readonly authService = inject(AuthService);
	public readonly tournamentService = inject(TournamentService);
	public readonly ts = inject(TranslationService);

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
	}

	protected setCatchTab(tab: CatchTab): void {
		this.activeCatchTab.set(tab);
	}

	protected setJudgingTab(tab: JudgingTab): void {
		this.activeJudgingTab.set(tab);
	}

	protected toggleCatchDetails(): void {
		this.showCatchDetailsDialog.update((v) => !v);
	}

	protected onSelectTournament(t: TournamentItem): void {
		this.activeTournamentId.set(t.id || t.title);
	}

	protected formatCatchTime(val: unknown): string {
		return formatCatchTime(val);
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
