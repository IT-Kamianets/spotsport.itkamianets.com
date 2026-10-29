import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageNavComponent } from '../../feature/navigation/page-nav.component';

type HomeTab = 'active' | 'previous' | 'join-create';

@Component({
	selector: 'app-home',
	imports: [RouterLink, PageNavComponent],
	templateUrl: './home.component.html',
})
export class HomeComponent {
	protected readonly activeTab = signal<HomeTab>('active');
	protected readonly showQrScannerDialog = signal(false);

	protected setTab(tab: HomeTab): void {
		this.activeTab.set(tab);
	}

	protected toggleQrScanner(): void {
		this.showQrScannerDialog.update((v) => !v);
	}
}
