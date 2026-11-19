import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslationService } from '../../services/translation.service';

@Component({
	selector: 'app-bottom-nav',
	imports: [RouterLink, RouterLinkActive],
	templateUrl: './bottom-nav.component.html',
})
export class BottomNavComponent {
	public readonly ts = inject(TranslationService);
}
