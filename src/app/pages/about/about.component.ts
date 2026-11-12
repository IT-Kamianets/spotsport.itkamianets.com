import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
	selector: 'app-about',
	imports: [RouterLink],
	templateUrl: './about.component.html',
})
export class AboutComponent {
	protected readonly author = {
		name: 'Костя Олійник',
		nameEn: 'Kostia Oliinyk',
		role: 'Creator & Lead Developer',
		roleUa: 'Автор та головний розробник',
		email: 'kn1b24.oliinyk@kpnu.edu.ua',
		university: "Кам'янець-Подільський національний університет імені Івана Огієнка",
		project: 'Гібридні мобільні додатки: SpotSport',
		organization: 'IT-Kamianets',
		githubUrl: 'https://github.com/IT-Kamianets/spotsport.itkamianets.com',
		githubOrgUrl: 'https://github.com/IT-Kamianets',
	};

	protected readonly pillars = [
		{
			icon: 'phishing',
			title: 'Catch-Photo-Release (CPR)',
			titleUa: 'Фіксація вилову (CPR)',
			description:
				'Modern catch validation for sport fishing tournaments. Anglers capture length, weight, photo evidence, and species with automatic timestamps.',
		},
		{
			icon: 'offline_bolt',
			title: 'Field-Ready Offline Sync',
			titleUa: 'Робота в польових умовах офлайн',
			description:
				'Designed for remote fishing venues and open waters. Catches are cached securely on the device and synchronized automatically upon reconnect.',
		},
		{
			icon: 'gavel',
			title: 'Digital Refereeing & Integrity',
			titleUa: 'Суддівство та верифікація',
			description:
				'Chief arbiters and judges inspect high-resolution photo submissions, record approval or rejection reasons, and apply tournament rule penalties.',
		},
		{
			icon: 'leaderboard',
			title: 'Live Standings & Scores',
			titleUa: 'Живі турнірні таблиці',
			description:
				'Real-time automated scoring recalculation gives spectators, fans, and competitors instant visibility into podium placements.',
		},
	];

	protected readonly techStack = [
		{ name: 'Angular 22', category: 'Modern Frontend & Signals', icon: 'code' },
		{ name: 'TypeScript', category: 'Strict Type Safety', icon: 'data_object' },
		{ name: 'Tailwind CSS', category: 'Adaptive UI & Responsive Layout', icon: 'palette' },
		{ name: 'Angular SSR / Prerender', category: 'High Performance & SEO', icon: 'speed' },
		{ name: 'Hybrid Architecture', category: 'Cross-Platform Mobile Ready', icon: 'smartphone' },
		{ name: 'PWA & Offline Cache', category: 'Resilient Field Operation', icon: 'wifi_off' },
	];
}
