import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { CompanyService } from '../../feature/company/company.service';
import { MVP_PAGES } from '../../feature/navigation/navigation.const';

interface FooterPageLink {
	label: string;
	path: string;
	number: number;
}

@Component({
	selector: 'app-footer',
	imports: [RouterLink, TranslateDirective],
	templateUrl: './footer.component.html',
})
export class FooterComponent {
	private readonly _companyService = inject(CompanyService);

	protected readonly company = this._companyService.company;
	protected readonly currentYear = new Date().getFullYear();
	protected readonly pageLinks = computed<FooterPageLink[]>(() =>
		MVP_PAGES.map((page) => ({
			label: page.title,
			path: page.path,
			number: page.number,
		})),
	);
	protected readonly companyImage = computed(() => this.company().image || 'logo.png');
	protected readonly companyImageAlt = computed(() =>
		this.company().name ? this.company().name : 'Company image',
	);
}
