import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageNavComponent } from '../../feature/navigation/page-nav.component';

export type RefereeingMode = 'catch' | 'judging';
export type CatchTab = 'submit' | 'status' | 'offline';
export type JudgingTab = 'review' | 'penalties' | 'leaderboard';

@Component({
	selector: 'app-refereeing',
	imports: [RouterLink, PageNavComponent],
	templateUrl: './refereeing.component.html',
})
export class RefereeingComponent {
	private readonly _route = inject(ActivatedRoute);

	protected readonly mode = signal<RefereeingMode>('catch');
	protected readonly activeCatchTab = signal<CatchTab>('submit');
	protected readonly activeJudgingTab = signal<JudgingTab>('review');
	protected readonly showCatchDetailsDialog = signal(false);

	constructor() {
		this._route.queryParams.subscribe((params) => {
			const mode = params['mode'];
			const tab = params['tab'];

			if (mode === 'judging' || tab === 'judging' || tab === 'review' || tab === 'penalties' || tab === 'leaderboard') {
				this.mode.set('judging');
				if (tab === 'review' || tab === 'penalties' || tab === 'leaderboard') {
					this.activeJudgingTab.set(tab);
				}
			} else if (mode === 'catch' || tab === 'catch' || tab === 'submit' || tab === 'status' || tab === 'offline') {
				this.mode.set('catch');
				if (tab === 'submit' || tab === 'status' || tab === 'offline') {
					this.activeCatchTab.set(tab);
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
}
