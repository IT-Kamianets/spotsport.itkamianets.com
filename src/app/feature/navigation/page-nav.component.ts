import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
	ADDITIONAL_UI_ITEMS,
	MVP_PAGES,
	POST_MVP_FEATURES,
} from './navigation.const';

@Component({
	selector: 'app-page-nav',
	imports: [RouterLink],
	templateUrl: './page-nav.component.html',
})
export class PageNavComponent {
	readonly currentPageId = input<string>('');

	protected readonly pages = MVP_PAGES;
	protected readonly additionalUi = ADDITIONAL_UI_ITEMS;
	protected readonly postMvp = POST_MVP_FEATURES;
	protected readonly showRoadmap = signal(false);

	protected readonly currentPage = computed(() =>
		this.pages.find((p) => p.id === this.currentPageId()),
	);

	protected readonly prevPage = computed(() => {
		const current = this.currentPage();
		if (!current) return undefined;
		const index = this.pages.findIndex((p) => p.id === current.id);
		return index > 0 ? this.pages[index - 1] : this.pages[this.pages.length - 1];
	});

	protected readonly nextPage = computed(() => {
		const current = this.currentPage();
		if (!current) return undefined;
		const index = this.pages.findIndex((p) => p.id === current.id);
		return index < this.pages.length - 1 ? this.pages[index + 1] : this.pages[0];
	});

	protected toggleRoadmap(): void {
		this.showRoadmap.update((v) => !v);
	}
}
