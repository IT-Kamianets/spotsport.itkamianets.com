import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslationService } from '../../services/translation.service';
import { ScrollService } from '../../services/scroll.service';

@Component({
	selector: 'app-bottom-nav',
	imports: [RouterLink, RouterLinkActive],
	templateUrl: './bottom-nav.component.html',
})
export class BottomNavComponent {
	public readonly ts = inject(TranslationService);
	public readonly scrollService = inject(ScrollService);

	public onNavClick(): void {
		this.scrollService.scrollToTop();
	}
}
