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
		id: 'home',
		number: 1,
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
		id: 'tournaments',
		number: 2,
		title: 'Tournaments',
		path: '/tournaments',
		icon: 'emoji_events',
		summary: 'Tournament overview, rules, participants, live status, results, and tournament editor.',
		features: [
			'Tournament Overview & Standings',
			'Rules & Scoring Criteria',
			'Participants List',
			'Live Status & Leaderboard',
			'Tournament Editor (Create / Edit)',
			'Scoring & Penalty Configurations',
		],
	},
	{
		id: 'refereeing',
		number: 3,
		title: 'Refereeing',
		path: '/refereeing',
		icon: 'gavel',
		summary: 'Submit and verify catches with photos, review queue, approval status, and penalties.',
		features: [
			'Catch Submission & Measurements',
			'Approval Status Tracker',
			'Offline Storage & Auto-Sync',
			'Judge Review Queue (Approve / Reject)',
			'Manage Penalties & Sanctions',
			'Live Arbiter Leaderboard',
		],
	},
	{
		id: 'about',
		number: 4,
		title: 'About',
		path: '/about',
		icon: 'info',
		summary: 'Platform overview, creator profile, mission, and architecture.',
		features: [
			'Project Mission & Capabilities',
			'Creator & Lead Developer',
			'University & Academic Context',
			'Technology Stack',
		],
	},
	{
		id: 'profile',
		number: 5,
		title: 'Profile',
		path: '/profile',
		icon: 'account_circle',
		summary: 'Personal information, tournament history, account settings, registration & login.',
		features: [
			'Personal Information',
			'Tournament History',
			'Account Settings',
			'User Registration & Sign In',
			'Password Recovery',
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
