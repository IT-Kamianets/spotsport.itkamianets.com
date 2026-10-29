import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageNavComponent } from '../../feature/navigation/page-nav.component';

type ProfileTab = 'personal' | 'history' | 'settings';

@Component({
	selector: 'app-profile',
	imports: [RouterLink, PageNavComponent],
	templateUrl: './profile.component.html',
})
export class ProfileComponent {
	protected readonly activeTab = signal<ProfileTab>('personal');

	protected setTab(tab: ProfileTab): void {
		this.activeTab.set(tab);
	}
}
