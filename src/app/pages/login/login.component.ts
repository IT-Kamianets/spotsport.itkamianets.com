import { Component, signal } from '@angular/core';
import { PageNavComponent } from '../../feature/navigation/page-nav.component';

type AuthTab = 'login' | 'register' | 'recovery';

@Component({
	selector: 'app-login',
	imports: [PageNavComponent],
	templateUrl: './login.component.html',
})
export class LoginComponent {
	protected readonly activeTab = signal<AuthTab>('login');

	protected setTab(tab: AuthTab): void {
		this.activeTab.set(tab);
	}
}
