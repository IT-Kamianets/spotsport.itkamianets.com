export interface MvpPageInfo {
	id: string;
	number: number;
	title: string;
	path: string;
	icon: string;
	summary: string;
	features: string[];
}

export interface AdditionalUiInfo {
	name: string;
	type: 'Dialog' | 'Tab' | 'Modal';
	icon: string;
	description: string;
}

export interface PostMvpFeature {
	name: string;
	icon: string;
	description: string;
}

export const MVP_PAGES: MvpPageInfo[] = [
	{
		id: 'login',
		number: 1,
		title: 'Login',
		path: '/login',
		icon: 'lock',
		summary: 'Registration, login, and password recovery.',
		features: [
			'User Registration',
			'Secure Sign In',
			'Password Recovery',
			'Session Management',
		],
	},
	{
		id: 'home',
		number: 2,
		title: 'Home',
		path: '/home',
		icon: 'home',
		summary: 'Active and previous tournaments, create or join tournaments via QR/code.',
		features: [
			'Active Tournaments',
			'Previous Tournaments',
			'Create Tournament CTA',
			'Join via QR or PIN Code',
		],
	},
	{
		id: 'tournament',
		number: 3,
		title: 'Tournament',
		path: '/tournament',
		icon: 'emoji_events',
		summary: 'Tournament overview, rules, participants, status, and results.',
		features: [
			'Tournament Overview',
			'Rules & Scoring Criteria',
			'Participants List',
			'Live Status',
			'Results & Leaderboard',
		],
	},
	{
		id: 'tournament-editor',
		number: 4,
		title: 'Tournament Editor',
		path: '/tournament-editor',
		icon: 'edit_note',
		summary: 'Create/edit tournament: name, type, dates, scoring rules, and penalties.',
		features: [
			'Tournament Name & Type',
			'Date & Schedule Picker',
			'Scoring Rules Config',
			'Penalty & Sanction Rules',
		],
	},
	{
		id: 'catch',
		number: 5,
		title: 'Catch',
		path: '/catch',
		icon: 'phishing',
		summary: 'Submit catches with photos and measurements, track approval status, offline support.',
		features: [
			'Photo & Measurement Upload',
			'Approval Status Tracker',
			'Offline Storage & Auto-Sync',
			'Catch Detail Cards',
		],
	},
	{
		id: 'judging',
		number: 6,
		title: 'Judging',
		path: '/judging',
		icon: 'gavel',
		summary: 'Review catches, approve/reject, manage penalties, and view live leaderboard.',
		features: [
			'Catch Review Queue',
			'Approve / Reject Actions',
			'Manage Penalties',
			'Live Leaderboard',
		],
	},
	{
		id: 'profile',
		number: 7,
		title: 'Profile',
		path: '/profile',
		icon: 'account_circle',
		summary: 'Personal information, tournament history, and account settings.',
		features: [
			'Personal Information',
			'Tournament History',
			'Trophies & Badges',
			'Account Settings',
		],
	},
];

export const ADDITIONAL_UI_ITEMS: AdditionalUiInfo[] = [
	{
		name: 'QR scanner',
		type: 'Dialog',
		icon: 'qr_code_scanner',
		description: 'Scan QR code to quickly join a tournament or verify catches',
	},
	{
		name: 'Participant list',
		type: 'Tab',
		icon: 'groups',
		description: 'View registered anglers, teams, and their readiness status',
	},
	{
		name: 'Tournament rules',
		type: 'Tab',
		icon: 'description',
		description: 'Comprehensive sporting guidelines, size limits, and ethical rules',
	},
	{
		name: 'Catch details',
		type: 'Dialog',
		icon: 'visibility',
		description: 'Inspect high-res photos, length, weight, timestamp, and judge remarks',
	},
	{
		name: 'Leaderboard',
		type: 'Tab',
		icon: 'leaderboard',
		description: 'Live real-time standings, points, and score breakdowns',
	},
	{
		name: 'Final results',
		type: 'Tab',
		icon: 'military_tech',
		description: 'Archived podium rankings, awards recap, and official results',
	},
];

export const POST_MVP_FEATURES: PostMvpFeature[] = [
	{
		name: 'GPS maps',
		icon: 'map',
		description: 'Geofenced tournament waters and catch spot coordinates',
	},
	{
		name: 'Teams',
		icon: 'diversity_3',
		description: 'Team competitions, angler squads, and collective team points',
	},
	{
		name: 'Subscriptions',
		icon: 'card_membership',
		description: 'Pro angler tier, tournament club passes, and premium analytics',
	},
	{
		name: 'Bluetooth scales',
		icon: 'scale',
		description: 'Direct wireless catch weight synchronization from certified scales',
	},
	{
		name: 'Advanced statistics',
		icon: 'insights',
		description: 'Deep performance analytics, weather correlations, and historical trends',
	},
];
