import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageNavComponent } from '../../feature/navigation/page-nav.component';

type TournamentTab = 'overview' | 'rules' | 'participants' | 'status' | 'leaderboard';

@Component({
	selector: 'app-tournament',
	imports: [RouterLink, PageNavComponent],
	templateUrl: './tournament.component.html',
})
export class TournamentComponent {
	protected readonly activeTab = signal<TournamentTab>('overview');

	protected setTab(tab: TournamentTab): void {
		this.activeTab.set(tab);
	}
}
