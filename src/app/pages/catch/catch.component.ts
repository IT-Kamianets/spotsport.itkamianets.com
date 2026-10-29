import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageNavComponent } from '../../feature/navigation/page-nav.component';

type CatchTab = 'submit' | 'status' | 'offline';

@Component({
	selector: 'app-catch',
	imports: [RouterLink, PageNavComponent],
	templateUrl: './catch.component.html',
})
export class CatchComponent {
	protected readonly activeTab = signal<CatchTab>('submit');
	protected readonly showCatchDetailsDialog = signal(false);

	protected setTab(tab: CatchTab): void {
		this.activeTab.set(tab);
	}

	protected toggleCatchDetails(): void {
		this.showCatchDetailsDialog.update((v) => !v);
	}
}
