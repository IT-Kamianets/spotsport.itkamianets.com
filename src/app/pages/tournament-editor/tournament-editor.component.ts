import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageNavComponent } from '../../feature/navigation/page-nav.component';

type EditorSection = 'general' | 'schedule' | 'scoring' | 'penalties';

@Component({
	selector: 'app-tournament-editor',
	imports: [RouterLink, PageNavComponent],
	templateUrl: './tournament-editor.component.html',
})
export class TournamentEditorComponent {
	protected readonly activeSection = signal<EditorSection>('general');

	protected setSection(section: EditorSection): void {
		this.activeSection.set(section);
	}
}
