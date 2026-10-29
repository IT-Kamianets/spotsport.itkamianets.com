import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageNavComponent } from '../../feature/navigation/page-nav.component';

type JudgingTab = 'review' | 'penalties' | 'leaderboard';

@Component({
	selector: 'app-judging',
	imports: [RouterLink, PageNavComponent],
	templateUrl: './judging.component.html',
})
export class JudgingComponent {
	protected readonly activeTab = signal<JudgingTab>('review');

	protected setTab(tab: JudgingTab): void {
		this.activeTab.set(tab);
	}
}
