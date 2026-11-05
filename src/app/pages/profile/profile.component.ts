import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageNavComponent } from '../../feature/navigation/page-nav.component';

export type ProfileTab = 'personal' | 'history' | 'settings' | 'auth';
export type AuthSubTab = 'login' | 'register' | 'recovery';

@Component({
	selector: 'app-profile',
	imports: [RouterLink, PageNavComponent],
	templateUrl: './profile.component.html',
})
export class ProfileComponent {
	private readonly _route = inject(ActivatedRoute);

	protected readonly activeTab = signal<ProfileTab>('personal');
	protected readonly activeAuthTab = signal<AuthSubTab>('login');

	constructor() {
		this._route.queryParams.subscribe((params) => {
			const tab = params['tab'];
			if (tab === 'login' || tab === 'auth') {
				this.activeTab.set('auth');
				this.activeAuthTab.set('login');
			} else if (tab === 'register') {
				this.activeTab.set('auth');
				this.activeAuthTab.set('register');
			} else if (tab === 'recovery') {
				this.activeTab.set('auth');
				this.activeAuthTab.set('recovery');
			} else if (tab === 'history' || tab === 'settings' || tab === 'personal') {
				this.activeTab.set(tab);
			}
		});
	}

	protected setTab(tab: ProfileTab): void {
		this.activeTab.set(tab);
	}

	protected setAuthTab(tab: AuthSubTab): void {
		this.activeAuthTab.set(tab);
	}
}
