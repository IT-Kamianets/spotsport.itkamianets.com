import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TournamentItem, TournamentService } from '../../services/tournament.service';
import { TranslationService } from '../../services/translation.service';
import { ScrollService } from '../../services/scroll.service';

type HomeTab = 'active' | 'previous';

@Component({
	selector: 'app-home',
	imports: [RouterLink],
	templateUrl: './home.component.html',
})
export class HomeComponent {
	public readonly tournamentService = inject(TournamentService);
	public readonly ts = inject(TranslationService);
	private readonly _scrollService = inject(ScrollService);

	protected readonly activeTab = signal<HomeTab>('active');

	protected readonly tournaments$ = this.tournamentService.getTournaments();
	protected readonly tournaments = toSignal(this.tournaments$, { initialValue: [] });

	protected readonly activeTournaments = computed(() => {
		const list = this.tournaments();
		const now = new Date();
		now.setHours(0, 0, 0, 0);

		return list.filter((t) => {
			if (t.status === 'completed') return false;
			if (t.status === 'active' || t.status === 'upcoming') return true;
			if (t.date) {
				const d = new Date(t.date);
				if (!isNaN(d.getTime())) {
					return d.getTime() >= now.getTime();
				}
			}
			return true;
		});
	});

	protected readonly previousTournaments = computed(() => {
		const list = this.tournaments();
		const now = new Date();
		now.setHours(0, 0, 0, 0);

		return list.filter((t) => {
			if (t.status === 'completed') return true;
			if (t.status === 'active' || t.status === 'upcoming') return false;
			if (t.date) {
				const d = new Date(t.date);
				if (!isNaN(d.getTime())) {
					return d.getTime() < now.getTime();
				}
			}
			return false;
		});
	});

	protected setTab(tab: HomeTab): void {
		this.activeTab.set(tab);
		this._scrollService.scrollToTop();
	}
}
