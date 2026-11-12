import { Routes } from '@angular/router';
import { buildRouteMeta } from '@wawjs/ngx-default';
import { companyProfile } from './feature/company/company.data';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () =>
			import('./pages/home/home.component').then((m) => m.HomeComponent),
		data: {
			meta: {
				...buildRouteMeta(companyProfile, '/'),
				title: 'SpotSport',
				description:
					'Active and previous tournaments, create or join tournaments via QR/code.',
			},
		},
	},
	{
		path: 'home',
		loadComponent: () =>
			import('./pages/home/home.component').then((m) => m.HomeComponent),
		data: {
			meta: {
				...buildRouteMeta(companyProfile, '/home'),
				title: 'Home — SpotSport',
				description:
					'Active and previous tournaments, create or join tournaments via QR/code.',
			},
		},
	},
	{
		path: 'login',
		redirectTo: 'profile',
	},
	{
		path: 'tournaments',
		loadComponent: () =>
			import('./pages/tournaments/tournaments.component').then(
				(m) => m.TournamentsComponent,
			),
		data: {
			meta: {
				...buildRouteMeta(companyProfile, '/tournaments'),
				title: 'Tournaments — SpotSport',
				description:
					'Tournament overview, rules, participants, status, results, and tournament editor.',
			},
		},
	},
	{
		path: 'tournament',
		redirectTo: 'tournaments',
	},
	{
		path: 'tournament-editor',
		redirectTo: 'tournaments',
	},
	{
		path: 'tournament/editor',
		redirectTo: 'tournaments',
	},
	{
		path: 'refereeing',
		loadComponent: () =>
			import('./pages/refereeing/refereeing.component').then(
				(m) => m.RefereeingComponent,
			),
		data: {
			meta: {
				...buildRouteMeta(companyProfile, '/refereeing'),
				title: 'Refereeing — SpotSport',
				description:
					'Submit and verify catches, review queue, approval status, penalties, and live leaderboard.',
			},
		},
	},
	{
		path: 'catch',
		redirectTo: 'refereeing',
	},
	{
		path: 'judging',
		redirectTo: 'refereeing',
	},
	{
		path: 'about',
		loadComponent: () =>
			import('./pages/about/about.component').then((m) => m.AboutComponent),
		data: {
			meta: {
				...buildRouteMeta(companyProfile, '/about'),
				title: 'About - SpotSport',
				description:
					'About SpotSport platform, mission, sport fishing tournament technology, and the creator.',
			},
		},
	},
	{
		path: 'profile',
		loadComponent: () =>
			import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
		data: {
			meta: {
				...buildRouteMeta(companyProfile, '/profile'),
				title: 'Profile — SpotSport',
				description:
					'Personal information, tournament history, account settings, registration, and login.',
			},
		},
	},
	{
		path: 'landing',
		loadComponent: () =>
			import('./pages/landing/landing.component').then((m) => m.LandingComponent),
	},
	{
		path: '**',
		redirectTo: '',
	},
];
