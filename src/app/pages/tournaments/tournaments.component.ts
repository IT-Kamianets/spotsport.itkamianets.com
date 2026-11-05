import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageNavComponent } from '../../feature/navigation/page-nav.component';

export type TournamentMainMode = 'view' | 'editor';
export type TournamentTab = 'overview' | 'rules' | 'participants' | 'status' | 'leaderboard';
export type EditorSection = 'general' | 'schedule' | 'scoring' | 'penalties';

@Component({
	selector: 'app-tournaments',
	imports: [RouterLink, PageNavComponent],
	templateUrl: './tournaments.component.html',
})
export class TournamentsComponent {
	private readonly _route = inject(ActivatedRoute);

	protected readonly mode = signal<TournamentMainMode>('view');
	protected readonly activeTab = signal<TournamentTab>('overview');
	protected readonly activeSection = signal<EditorSection>('general');

	constructor() {
		this._route.queryParams.subscribe((params) => {
			const tab = params['tab'];
			const mode = params['mode'];

			if (mode === 'editor' || tab === 'editor') {
				this.mode.set('editor');
			} else if (mode === 'view') {
				this.mode.set('view');
			}

			if (tab === 'rules' || tab === 'participants' || tab === 'status' || tab === 'leaderboard' || tab === 'overview') {
				this.mode.set('view');
				this.activeTab.set(tab);
			} else if (tab === 'general' || tab === 'schedule' || tab === 'scoring' || tab === 'penalties') {
				this.mode.set('editor');
				this.activeSection.set(tab);
			}
		});
	}

	protected setMode(mode: TournamentMainMode): void {
		this.mode.set(mode);
	}

	protected setTab(tab: TournamentTab): void {
		this.activeTab.set(tab);
	}

	protected setSection(section: EditorSection): void {
		this.activeSection.set(section);
	}
}
