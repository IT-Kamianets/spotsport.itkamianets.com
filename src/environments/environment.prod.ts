export interface FirebaseConfig {
	apiKey: string;
	authDomain: string;
	projectId: string;
	storageBucket: string;
	messagingSenderId: string;
	appId: string;
	measurementId?: string;
}

export interface AppLanguage {
	code: string;
	name: string;
	nativeName: string;
	flagSrc: string;
	htmlLang: string;
	population: number;
}

export const environment = {
	apiUrl: 'https://it.webart.work',
	appVersion: '1.0.0',
	production: true,
	companyId: 'demo',
	defaultLanguage: 'en',
	firebaseConfig: {
		apiKey: 'AIzaSyAvnoBbtnbjr2w7nXD0k8KbfBxvZlqfK7s',
		authDomain: 'spotsport-64708.firebaseapp.com',
		projectId: 'spotsport-64708',
		storageBucket: 'spotsport-64708.firebasestorage.app',
		messagingSenderId: '1056344541924',
		appId: '1:1056344541924:web:764ec6558323ea9b4abaf1',
		measurementId: 'G-2V0T3KGW6X',
	},
	languages: [
		{
			code: 'en',
			name: 'English',
			nativeName: 'English',
			flagSrc: 'flags/united-kingdom.svg',
			htmlLang: 'en',
			population: 280,
		},
		{
			code: 'ua',
			name: 'Ukrainian',
			nativeName: 'Українська',
			flagSrc: 'flags/ukraine.svg',
			htmlLang: 'uk',
			population: 35,
		},
	],
};
