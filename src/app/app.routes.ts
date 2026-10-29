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
		loadComponent: () =>
			import('./pages/login/login.component').then((m) => m.LoginComponent),
		data: {
			meta: {
				...buildRouteMeta(companyProfile, '/login'),
				title: 'Login — SpotSport',
				description: 'Registration, login, and password recovery.',
			},
		},
	},
	{
		path: 'tournament',
		loadComponent: () =>
			import('./pages/tournament/tournament.component').then((m) => m.TournamentComponent),
		data: {
			meta: {
				...buildRouteMeta(companyProfile, '/tournament'),
				title: 'Tournament — SpotSport',
				description: 'Tournament overview, rules, participants, status, and results.',
			},
		},
	},
	{
		path: 'tournament-editor',
		loadComponent: () =>
			import('./pages/tournament-editor/tournament-editor.component').then(
				(m) => m.TournamentEditorComponent,
			),
		data: {
			meta: {
				...buildRouteMeta(companyProfile, '/tournament-editor'),
				title: 'Tournament Editor — SpotSport',
				description:
					'Create/edit tournament: name, type, dates, scoring rules, and penalties.',
			},
		},
	},
	{
		path: 'tournament/editor',
		redirectTo: 'tournament-editor',
	},
	{
		path: 'catch',
		loadComponent: () =>
			import('./pages/catch/catch.component').then((m) => m.CatchComponent),
		data: {
			meta: {
				...buildRouteMeta(companyProfile, '/catch'),
				title: 'Catch — SpotSport',
				description:
					'Submit catches with photos and measurements, track approval status, offline support.',
			},
		},
	},
	{
		path: 'judging',
		loadComponent: () =>
			import('./pages/judging/judging.component').then((m) => m.JudgingComponent),
		data: {
			meta: {
				...buildRouteMeta(companyProfile, '/judging'),
				title: 'Judging — SpotSport',
				description:
					'Review catches, approve/reject, manage penalties, and view live leaderboard.',
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
				description: 'Personal information, tournament history, and account settings.',
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
