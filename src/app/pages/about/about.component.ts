import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../services/translation.service';

@Component({
	selector: 'app-about',
	imports: [RouterLink],
	templateUrl: './about.component.html',
})
export class AboutComponent {
	public readonly ts = inject(TranslationService);

	protected readonly author = {
		name: 'Костя Олійник',
		nameEn: 'Kostia Oliinyk',
		role: 'Creator & Lead Developer',
		roleUa: 'Автор та головний розробник',
		email: 'kn1b24.oliinyk@kpnu.edu.ua',
		resumeUrl: 'https://kostia-oliinyk.itkamianets.com/',
		university: "Кам'янець-Подільський національний університет імені Івана Огієнка",
		universityEn: 'Kamianets-Podilskyi Ivan Ohiienko National University',
		project: 'Гібридні мобільні додатки: SpotSport',
		projectEn: 'Hybrid Mobile Applications: SpotSport',
		organization: 'IT-Kamianets',
		githubUrl: 'https://github.com/IT-Kamianets/spotsport.itkamianets.com',
		githubOrgUrl: 'https://github.com/IT-Kamianets',
	};

	protected readonly pillars = computed(() => [
		{
			icon: 'phishing',
			title: this.ts.t('about.pillarCprTitle'),
			description: this.ts.t('about.pillarCprDesc'),
		},
		{
			icon: 'offline_bolt',
			title: this.ts.t('about.pillarOfflineTitle'),
			description: this.ts.t('about.pillarOfflineDesc'),
		},
		{
			icon: 'gavel',
			title: this.ts.t('about.pillarRefereeTitle'),
			description: this.ts.t('about.pillarRefereeDesc'),
		},
		{
			icon: 'leaderboard',
			title: this.ts.t('about.pillarLeaderboardTitle'),
			description: this.ts.t('about.pillarLeaderboardDesc'),
		},
	]);

	protected readonly techStack = computed(() => {
		const isUk = this.ts.currentLang() === 'uk';
		return [
			{
				name: 'Angular 22',
				category: isUk ? 'Сучасний фронтенд та сигнали' : 'Modern Frontend & Signals',
				icon: 'code',
			},
			{
				name: 'TypeScript',
				category: isUk ? 'Сувора типізація' : 'Strict Type Safety',
				icon: 'data_object',
			},
			{
				name: 'Tailwind CSS',
				category: isUk ? 'Адаптивний інтерфейс та верстка' : 'Adaptive UI & Responsive Layout',
				icon: 'palette',
			},
			{
				name: 'Angular SSR / Prerender',
				category: isUk ? 'Висока продуктивність та SEO' : 'High Performance & SEO',
				icon: 'speed',
			},
			{
				name: 'Hybrid Architecture',
				category: isUk ? 'Кросплатформна мобільна готовність' : 'Cross-Platform Mobile Ready',
				icon: 'smartphone',
			},
			{
				name: 'Cloud Firestore',
				category: isUk ? 'Реактивна NoSQL хмарна база даних' : 'Reactive NoSQL Cloud Database',
				icon: 'database',
			},
		];
	});
}
