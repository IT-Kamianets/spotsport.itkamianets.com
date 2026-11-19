import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export type AppLang = 'en' | 'uk';

export interface LanguageOption {
	code: AppLang;
	name: string;
	nativeName: string;
	flagSrc: string;
	htmlLang: string;
}

export const APP_LANGUAGES: LanguageOption[] = [
	{
		code: 'en',
		name: 'English',
		nativeName: 'English',
		flagSrc: 'flags/united-kingdom.svg',
		htmlLang: 'en',
	},
	{
		code: 'uk',
		name: 'Ukrainian',
		nativeName: 'Українська',
		flagSrc: 'flags/ukraine.svg',
		htmlLang: 'uk',
	},
];

const TRANSLATIONS_EN: Record<string, string> = {
	// Topbar & Navigation
	'nav.tournaments': 'Tournaments',
	'nav.refereeing': 'Refereeing',
	'nav.about': 'About',
	'nav.profile': 'Profile',
	'nav.github': 'GitHub Repository',
	'nav.githubTitle': 'SpotSport on GitHub',
	'nav.mvpPages': 'SpotSport MVP Pages',
	'nav.home': 'Home',
	'nav.githubDesc': 'Source code, releases, and documentation.',
	'nav.tournamentsDesc': 'Tournament overview, rules, participants, live status, results, and tournament editor.',
	'nav.refereeingDesc': 'Submit and verify catches with photos, review queue, approval status, and penalties.',
	'nav.aboutDesc': 'Platform overview, creator profile, mission, and architecture.',
	'nav.profileDesc': 'Personal information, tournament history, account settings, registration & login.',
	'nav.toggleMenu': 'Toggle navigation menu',
	'nav.profileMenu': 'Profile navigation menu',
	'lang.openMenu': 'Open language menu',
	'lang.switch': 'Switch language to',

	// Profile Header & Actions
	'profile.badge': 'MVP Page 06',
	'profile.category': 'User Account & Auth',
	'profile.title': 'Angler Profile & Authentication',
	'profile.desc': 'Personal information, tournament history, account settings, registration, login, and password recovery.',
	'profile.signOut': 'Sign Out',
	'profile.signInRegister': 'Sign In / Register',
	'profile.sportAngler': 'Sport Angler',
	'profile.verifiedBadge': 'Verified via Google / Firebase',
	'profile.firestoreDoc': 'Firestore Document:',
	'profile.authProvider': 'Auth Provider',
	'profile.googleAccount': 'Google Account',
	'profile.emailPassword': 'Email & Password',
	'profile.emailStatus': 'Email Status',
	'profile.verified': 'Verified',
	'profile.verificationPending': 'Verification Pending',
	'profile.databaseSync': 'Database Sync',
	'profile.firestoreActive': 'Firestore Active',

	// Profile Tabs
	'tab.personal': '1. Personal Information',
	'tab.history': '2. Tournament History',
	'tab.settings': '3. Account Settings',
	'tab.auth': '4. Login & Registration',

	// Profile Tab 1: Personal Unauthenticated
	'personal.unauthTitle': 'Angler Identity & Fishing License',
	'personal.unauthDesc': 'Sign in with your Google account or email to link your angler profile, tournament results, and catches.',
	'personal.signInGoogle': 'Sign in with Google',
	'personal.signingIn': 'Signing in...',
	'personal.openAuthHub': 'Open Auth Hub',

	// Profile Tab 2: History
	'history.title': 'Past Tournaments, Catches & Trophies',
	'history.desc': 'Participated tournaments log, podium placements, personal best catch records, and earned badges.',
	'history.badgeLog': 'Past Tournaments Log Ready',
	'history.badgeTrophies': 'Catch Trophies Ready',

	// Profile Tab 3: Settings
	'settings.appearanceTitle': 'Preferences & Appearance',
	'settings.appearanceDesc': 'Customize language and interface theme for your SpotSport experience.',
	'settings.appLanguage': 'Application Language',
	'settings.current': 'Current:',
	'settings.colorTheme': 'Color Theme',
	'settings.currentMode': 'Current mode:',
	'settings.switchToLight': 'Switch to Light Mode',
	'settings.switchToDark': 'Switch to Dark Mode',
	'settings.unitsTitle': 'Measurement Units & Notification Settings',
	'settings.unitsDesc': 'Measurement units (cm/mm vs inches, kg vs lbs), push notification settings, offline sync preferences, and password change.',
	'settings.badgeUnits': 'Unit Conversion System Ready',
	'settings.badgePush': 'Push Notifications Ready',

	// Profile Tab 4: Auth Hub Authenticated
	'auth.signedInTitle': 'Authenticated Angler',
	'auth.signedInAs': 'Signed in as',
	'auth.emailVerified': 'Email Verified',
	'auth.emailUnverified': 'Email Unverified',
	'auth.providerLabel': 'Provider:',
	'auth.firestoreSynced': 'Firestore Synced (spotsport-64708)',
	'auth.viewIdentity': 'View Angler Identity',

	// Profile Tab 4: Auth Subtabs
	'auth.subtabLogin': 'Sign In',
	'auth.subtabRegister': 'Registration',
	'auth.subtabRecovery': 'Password Recovery',

	// Google Button
	'auth.googleBtn': 'Authentification with Google',
	'auth.googleLoading': 'Authentification with Google...',
	'auth.orEmail': 'or with email',
	'auth.orRegisterEmail': 'or register with email',

	// Form Labels & Inputs
	'form.email': 'Email address',
	'form.password': 'Password',
	'form.confirmPassword': 'Confirm password',
	'form.regEmailLabel': 'Registration with Email',
	'form.resetTitle': 'Reset Password',
	'form.resetDesc': 'Enter your registered email address to receive a secure password recovery link.',
	'form.signInBtn': 'Sign In to Account',
	'form.signingInBtn': 'Signing In...',
	'form.registerBtn': 'Register with Email',
	'form.registeringBtn': 'Registering...',
	'form.sendResetBtn': 'Send Password Reset Link',
	'form.sendingResetBtn': 'Sending Link...',

	// Validation Messages
	'val.emailRequired': 'Email is required.',
	'val.emailFormat': 'Please enter a valid email format.',
	'val.passwordRequired': 'Password is required.',
	'val.passwordMinLength': 'Minimum 6 characters.',
	'val.confirmRequired': 'Please confirm your password.',
	'val.passwordMismatch': 'Passwords do not match.',

	// Feedback Messages
	'msg.signInSuccess': 'Successfully signed in! Angler profile loaded from Firestore.',
	'msg.registerSuccess': 'Registration successful! Verification email sent and angler profile saved to Firestore database.',
	'msg.recoverySuccess': 'Password reset email sent. Please check your inbox.',
	'msg.signOutSuccess': 'Successfully signed out.',
	'msg.googleSuccess': 'Successfully authenticated with Google! Angler profile synced to Cloud Firestore database.',

	// Tournaments Page
	'tourn.badge': 'MVP Page 02',
	'tourn.category': 'Tournament Platform',
	'tourn.title': 'Tournaments & Tournament Editor',
	'tourn.desc': 'Tournament overview, rules, participants, status, results, and tournament management.',
	'tourn.createBtn': '+ Create Tournament',
	'tourn.submitCatchBtn': 'Submit Catch',
	'tourn.backToTournaments': 'Back to Tournaments',
	'tourn.saveTournament': 'Save Tournament',
	'tourn.saving': 'Saving...',
	'tourn.tournamentsTab': 'Tournaments',
	'tourn.subtabOverview': 'Overview & Info',
	'tourn.subtabList': 'Tournaments List',
	'tourn.subtabRules': 'Tournament Rules',
	'tourn.subtabParticipants': 'Participant List',
	'tourn.subtabStatus': 'Status & Schedule',
	'tourn.subtabLeaderboard': 'Leaderboard & Results',
	'tourn.publishedHeading': 'Published Tournaments',
	'tourn.cloudLive': 'Cloud Firestore Live',
	'tourn.statusActive': 'Active',
	'tourn.targetLabel': 'Target:',
	'tourn.rulesLabel': 'Rules:',
	'tourn.refereeingBtn': 'Refereeing',
	'tourn.detailsBtn': 'Details',
	'tourn.emptyTitle': 'No Tournaments Published Yet',
	'tourn.emptyDesc': 'Create your first tournament using the form to publish it to Cloud Firestore with venue, species, and CPR rules.',
	'tourn.phRulesTitle': 'Tournament Rules & Regulations',
	'tourn.phRulesDesc': 'Minimum catch size limits, eligible tackle, catch-and-release conditions, and time limits will be listed here.',
	'tourn.phPartTitle': 'Participant Anglers Roster',
	'tourn.phPartDesc': 'Registered angler profiles, boat numbers, squad assignments, and readiness statuses.',
	'tourn.phStatusTitle': 'Live Status & Rounds Schedule',
	'tourn.phStatusDesc': 'Tournament clock, start/finish guns, active round indicators, and weather advisories.',
	'tourn.phLeadTitle': 'Live Leaderboard & Final Results',
	'tourn.phLeadDesc': 'Real-time score tally, total catch length/weight, biggest fish prize leader, and final podium rankings.',
	'tourn.editorTitle': 'Tournament Editor & Setup',
	'tourn.editorDesc': 'Fill in the details below to create and publish a new sport fishing tournament to Cloud Firestore.',
	'tourn.cancel': 'Cancel',
	'tourn.fieldTitle': 'Tournament Title *',
	'tourn.phTitle': 'e.g. Dniester Predator Cup 2026',
	'tourn.valTitle': 'Tournament title is required.',
	'tourn.fieldHost': 'Host Club / Organization *',
	'tourn.phHost': 'e.g. SpotSport Fishing Federation',
	'tourn.valHost': 'Host club or organization is required.',
	'tourn.fieldWater': 'Water Body / Location *',
	'tourn.phWater': 'e.g. Dniester River Basin, Kamianets-Podilskyi',
	'tourn.valWater': 'Water body or venue location is required.',
	'tourn.fieldDate': 'Tournament Date *',
	'tourn.valDate': 'Tournament date is required.',
	'tourn.fieldSpecies': 'Target Fish Species *',
	'tourn.phSpecies': 'e.g. Pike, Zander, Perch',
	'tourn.valSpecies': 'Target species are required.',
	'tourn.fieldDesc': 'Tournament Description *',
	'tourn.phDesc': 'Describe competition format, categories (boat/shore), participation quotas, and registration schedule...',
	'tourn.valDesc': 'Tournament description is required.',
	'tourn.fieldRules': 'Tournament Rules & Catch Validation Criteria *',
	'tourn.phRules': 'CPR format specifications, minimum fish lengths, measurement ruler visibility, allowed bait/tackle, and safety regulations...',
	'tourn.valRules': 'Tournament rules are required.',
	'tourn.savingToFirestore': 'Saving to Firestore...',
	'tourn.modalWater': 'Water Body:',
	'tourn.modalHost': 'Host Club:',
	'tourn.modalDate': 'Date:',
	'tourn.modalSpecies': 'Target Species:',
	'tourn.modalRules': 'Rules & Catch-Photo-Release Guidelines',
	'tourn.modalSubmitCatch': 'Submit a Catch',
	'tourn.modalClose': 'Close',
	'tourn.detailsTitle': 'Tournament Overview & Details',
	'tourn.detailsCategory': 'Tournament Management',
	'tourn.tabOverview': '1. Overview & Info',
	'tourn.tabRules': '2. Rules & Regulations',
	'tourn.tabParticipants': '3. Participants Roster',
	'tourn.tabLeaderboard': '4. Leaderboard & Scoring',
	'tourn.tournamentFormat': 'Tournament Format & Identity',
	'tourn.venueInfo': 'Venue & Water Body',
	'tourn.organizer': 'Organizer',
	'tourn.targetSpeciesLabel': 'Target Species',
	'tourn.rulesOverview': 'Catch Validation & Rules',
	'tourn.scoringCriteria': 'Scoring Criteria & Multipliers',
	'tourn.joinTournament': 'Join Tournament',
	'tourn.joining': 'Joining...',
	'tourn.alreadyJoined': 'Joined',
	'tourn.joinSuccess': 'You have successfully joined the tournament!',
	'tourn.alreadyRegistered': 'You are already registered for this tournament.',
	'tourn.authRequiredToJoin': 'Please sign in or create an angler account to join this tournament.',
	'tourn.joinError': 'Failed to join tournament. Please try again.',
	'tourn.emptyParticipants': 'No participants have joined this tournament yet. Be the first to join!',
	'tourn.shareQr': 'Share / QR',
	'tourn.qrModalTitle': 'Share Tournament',
	'tourn.qrDirectUrl': 'Direct URL',
	'tourn.qrCopyLink': 'Copy Link',
	'tourn.qrCopied': 'Copied!',
	'tourn.qrClose': 'Close',
	'tourn.scanQr': 'Scan QR Code',
	'tourn.joinViaCode': 'Join via Code / QR',
	'tourn.joinViaCodePlaceholder': 'Paste tournament URL or ID…',
	'tourn.joinViaCodeBtn': 'Go to Tournament',
	'tourn.scanModalTitle': 'Scan Tournament QR',
	'tourn.scanInstruction': 'Point the camera at a SpotSport tournament QR code.',
	'tourn.scanError': 'Camera access denied or not available.',
	'tourn.scanClose': 'Close Scanner',

	// Refereeing Page
	'ref.badge': 'MVP Page 03',
	'ref.category': 'Arbiter & Catches',
	'ref.title': 'Refereeing & Catch Verification',
	'ref.desc': 'Submit catches with photos and measurements, track approval status, review catches, manage penalties, and view live leaderboard.',
	'ref.catchModalBtn': 'Catch Details Modal',
	'ref.switchToJudging': 'Switch to Judging',
	'ref.switchToCatch': 'Switch to Catch Submission',
	'ref.dialogTitle': 'Additional UI: Catch Details Dialog',
	'ref.dialogPlaceholder': 'Dialog Placeholder',
	'ref.dialogPhotoText': 'Fish Photo with Measuring Ruler',
	'ref.dialogSpecies': 'Species:',
	'ref.dialogLength': 'Length:',
	'ref.dialogWeight': 'Weight:',
	'ref.dialogSubmitted': 'Submitted:',
	'ref.dialogOfflineSynced': '(Local offline queue synced)',
	'ref.dialogJudgeStatus': 'Judge Status:',
	'ref.dialogApprovedPts': 'Approved (+84.5 pts)',
	'ref.modeCatch': '1. Catch Submissions (Angler View)',
	'ref.modeJudging': '2. Judging & Arbiter Review',
	'ref.subtabSubmit': 'Submit New Catch',
	'ref.subtabStatus': 'Approval Status',
	'ref.subtabOffline': 'Offline Queue & Sync',
	'ref.phSubmitTitle': 'Photo & Measurement Submission Form (Empty State)',
	'ref.phSubmitDesc': 'High-resolution photo upload with ruler alignment, fish length in mm/cm, scale weight, and GPS spot capture.',
	'ref.phStatusTitle': 'Catch Approval Status Tracker (Empty State)',
	'ref.phStatusDesc': 'Tracks state across Pending Verification, Judge Accepted, Penalty Deduction, and Rejected.',
	'ref.phOfflineTitle': 'Offline Storage & Auto-Sync Engine (Empty State)',
	'ref.phOfflineDesc': 'Catches saved in local IndexedDB when mobile network is weak on the water, with automatic background sync when reconnected.',
	'ref.badgeCacheReady': 'IndexedDB Offline Cache Ready',
	'ref.badgeGpsReady': 'Exif Timestamp & GPS Extractor Ready',
	'ref.badgePushReady': 'Live Status Push Ready',
	'ref.judgingTabReview': '1. Catch Review Queue',
	'ref.judgingTabPenalties': '2. Manage Penalties',
	'ref.judgingTabLeaderboard': '3. Live Leaderboard Monitor',
	'ref.phReviewTitle': 'Catches Verification Queue (Empty State)',
	'ref.phReviewDesc': 'Incoming catch queue: photo measurement ruler check, side-by-side verification, quick Approve (green) / Reject (red) buttons with rejection reason picker.',
	'ref.phPenaltiesTitle': 'Participant Penalty Manager (Empty State)',
	'ref.phPenaltiesDesc': 'Assign yellow cards, points deduction, boundary violation sanctions, or disqualifications with judge notes.',
	'ref.phLeaderboardTitle': 'Live Arbiter Leaderboard Control (Empty State)',
	'ref.phLeaderboardDesc': 'Arbiter view of real-time point distribution, instant recalculation, freeze board toggle, and audit history.',
	'ref.badgeTwoJudge': 'Two-Judge Audit Ready',
	'ref.badgeDispute': 'Dispute Resolution Protocol Ready',
	'ref.badgeSockets': 'Real-Time Socket Sync Ready',

	// About Page
	'about.badge': 'About Project',
	'about.category': 'SpotSport Platform',
	'about.title': 'About SpotSport & Creator',
	'about.exploreTournaments': 'Explore Tournaments',
	'about.refereeingHub': 'Refereeing Hub',
	'about.desc': 'SpotSport is a hybrid mobile and web platform for sport fishing competitions, Catch-Photo-Release (CPR) tracking, electronic refereeing, and live tournament leaderboards.',
	'about.creatorActive': 'Creator Active',
	'about.devResume': 'Developer Resume',
	'about.conceptTitle': 'About the Developer & Concept',
	'about.conceptText': 'Kostia Oliinyk is developing the SpotSport platform as a modern solution within the "Hybrid Mobile Applications" academic course at Kamianets-Podilskyi Ivan Ohiienko National University. The project combines next-generation web technologies (Angular 22, SSR) with mobile capabilities (PWA, offline catch caching on the water), ensuring fair refereeing and transparent results for the sport fishing community.',
	'about.city': '📍 Kamianets-Podilskyi, Ukraine',
	'about.university': '🏛️ KPNU named after Ivan Ohiienko',
	'about.initiative': '🌐 IT-Kamianets Initiative',
	'about.capabilities': 'Platform Capabilities',
	'about.modernizeTitle': 'How SpotSport Modernizes Tournaments',
	'about.modernizeDesc': 'Designed for sports fishing clubs, organizers, judges, and athletes looking for instant, verifiable competition management.',
	'about.pillarCprTitle': 'Catch-Photo-Release (CPR)',
	'about.pillarCprDesc': 'Modern catch validation for sport fishing tournaments. Anglers capture length, weight, photo evidence, and species with automatic timestamps.',
	'about.pillarOfflineTitle': 'Field-Ready Offline Sync',
	'about.pillarOfflineDesc': 'Designed for remote fishing venues and open waters. Catches are cached securely on the device and synchronized automatically upon reconnect.',
	'about.pillarRefereeTitle': 'Digital Refereeing & Integrity',
	'about.pillarRefereeDesc': 'Chief arbiters and judges inspect high-resolution photo submissions, record approval or rejection reasons, and apply tournament rule penalties.',
	'about.pillarLeaderboardTitle': 'Live Standings & Scores',
	'about.pillarLeaderboardDesc': 'Real-time automated scoring recalculation gives spectators, fans, and competitors instant visibility into podium placements.',
	'about.techStackTitle': 'Engineering & Tech Stack',
	'about.techStackDesc': 'Built with cutting-edge open web standards ensuring high performance, low latency, and smooth responsive rendering across mobile and desktop.',
	'about.ctaTitle': 'Ready to dive into the SpotSport platform?',
	'about.ctaDesc': 'Check out live tournaments, view the refereeing process, or manage your angler profile.',
	'about.ctaTournaments': 'Tournaments',
	'about.ctaProfile': 'Angler Profile',
};

const TRANSLATIONS_UK: Record<string, string> = {
	// Topbar & Navigation
	'nav.tournaments': 'Турніри',
	'nav.refereeing': 'Суддівство',
	'nav.about': 'Про проєкт',
	'nav.profile': 'Профіль',
	'nav.github': 'Репозиторій GitHub',
	'nav.githubTitle': 'SpotSport на GitHub',
	'nav.mvpPages': 'Сторінки SpotSport MVP',
	'nav.home': 'Головна',
	'nav.githubDesc': 'Вихідний код, релізи та документація.',
	'nav.tournamentsDesc': 'Огляд турнірів, правила, учасники, статус наживо, результати та редактор турнірів.',
	'nav.refereeingDesc': 'Подання та перевірка виловів з фото, черга суддівства, статус схвалення та штрафи.',
	'nav.aboutDesc': 'Огляд платформи, профіль автора, місія та архітектура.',
	'nav.profileDesc': 'Особиста інформація, історія турнірів, налаштування облікового запису, реєстрація та вхід.',
	'nav.toggleMenu': 'Перемкнути меню навігації',
	'nav.profileMenu': 'Меню профілю',
	'lang.openMenu': 'Відкрити меню мов',
	'lang.switch': 'Перемкнути мову на',

	// Profile Header & Actions
	'profile.badge': 'MVP Сторінка 06',
	'profile.category': 'Обліковий запис і авторизація',
	'profile.title': 'Профіль рибалки та автентифікація',
	'profile.desc': 'Особиста інформація, історія турнірів, налаштування облікового запису, реєстрація, вхід та відновлення пароля.',
	'profile.signOut': 'Вийти',
	'profile.signInRegister': 'Увійти / Зареєструватися',
	'profile.sportAngler': 'Спортивний рибалка',
	'profile.verifiedBadge': 'Підтверджено через Google / Firebase',
	'profile.firestoreDoc': 'Документ Firestore:',
	'profile.authProvider': 'Провайдер авторизації',
	'profile.googleAccount': 'Обліковий запис Google',
	'profile.emailPassword': 'Email та пароль',
	'profile.emailStatus': 'Статус Email',
	'profile.verified': 'Підтверджено',
	'profile.verificationPending': 'Очікує підтвердження',
	'profile.databaseSync': 'Синхронізація БД',
	'profile.firestoreActive': 'Firestore активний',

	// Profile Tabs
	'tab.personal': '1. Особиста інформація',
	'tab.history': '2. Історія турнірів',
	'tab.settings': '3. Налаштування акаунту',
	'tab.auth': '4. Вхід та реєстрація',

	// Profile Tab 1: Personal Unauthenticated
	'personal.unauthTitle': 'Ідентифікатор рибалки та квиток',
	'personal.unauthDesc': 'Увійдіть за допомогою облікового запису Google або email, щоб повʼязати свій профіль, результати турнірів та вилови.',
	'personal.signInGoogle': 'Увійти через Google',
	'personal.signingIn': 'Вхід...',
	'personal.openAuthHub': 'Відкрити центр входу',

	// Profile Tab 2: History
	'history.title': 'Минулі турніри, вилови та трофеї',
	'history.desc': 'Журнал участі в турнірах, призові місця, особисті рекорди та здобуті відзнаки.',
	'history.badgeLog': 'Журнал турнірів готовий',
	'history.badgeTrophies': 'Трофеї виловів готові',

	// Profile Tab 3: Settings
	'settings.appearanceTitle': 'Налаштування та вигляд',
	'settings.appearanceDesc': 'Налаштуйте мову та тему інтерфейсу для комфортної роботи зі SpotSport.',
	'settings.appLanguage': 'Мова застосунку',
	'settings.current': 'Поточна:',
	'settings.colorTheme': 'Тема оформлення',
	'settings.currentMode': 'Поточний режим:',
	'settings.switchToLight': 'Перемкнути на світлу тему',
	'settings.switchToDark': 'Перемкнути на темну тему',
	'settings.unitsTitle': 'Одиниці вимірювання та сповіщення',
	'settings.unitsDesc': 'Одиниці вимірювання (см/мм проти дюймів, кг проти фунтів), налаштування сповіщень, параметри офлайн-синхронізації та зміна пароля.',
	'settings.badgeUnits': 'Система конвертації готова',
	'settings.badgePush': 'Push-сповіщення готові',

	// Profile Tab 4: Auth Hub Authenticated
	'auth.signedInTitle': 'Авторизований рибалка',
	'auth.signedInAs': 'Ви увійшли як',
	'auth.emailVerified': 'Email підтверджено',
	'auth.emailUnverified': 'Email не підтверджено',
	'auth.providerLabel': 'Провайдер:',
	'auth.firestoreSynced': 'Firestore синхронізовано (spotsport-64708)',
	'auth.viewIdentity': 'Переглянути профіль',

	// Profile Tab 4: Auth Subtabs
	'auth.subtabLogin': 'Вхід',
	'auth.subtabRegister': 'Реєстрація',
	'auth.subtabRecovery': 'Відновлення пароля',

	// Google Button
	'auth.googleBtn': 'Автентифікація через Google',
	'auth.googleLoading': 'Автентифікація через Google...',
	'auth.orEmail': 'або через email',
	'auth.orRegisterEmail': 'або реєстрація через email',

	// Form Labels & Inputs
	'form.email': 'Адреса електронної пошти',
	'form.password': 'Пароль',
	'form.confirmPassword': 'Підтвердіть пароль',
	'form.regEmailLabel': 'Реєстрація через Email',
	'form.resetTitle': 'Скинути пароль',
	'form.resetDesc': 'Введіть зареєстровану адресу електронної пошти, щоб отримати безпечне посилання для відновлення пароля.',
	'form.signInBtn': 'Увійти до акаунту',
	'form.signingInBtn': 'Вхід до акаунту...',
	'form.registerBtn': 'Зареєструватися через Email',
	'form.registeringBtn': 'Реєстрація...',
	'form.sendResetBtn': 'Надіслати посилання для скидання',
	'form.sendingResetBtn': 'Надсилання посилання...',

	// Validation Messages
	'val.emailRequired': 'Введіть адресу електронної пошти.',
	'val.emailFormat': 'Будь ласка, введіть коректний формат email.',
	'val.passwordRequired': 'Пароль є обовʼязковим.',
	'val.passwordMinLength': 'Мінімум 6 символів.',
	'val.confirmRequired': 'Будь ласка, підтвердіть пароль.',
	'val.passwordMismatch': 'Паролі не співпадають.',

	// Feedback Messages
	'msg.signInSuccess': 'Успішний вхід! Профіль рибалки завантажено з Firestore.',
	'msg.registerSuccess': 'Реєстрація успішна! Лист із підтвердженням надіслано, а профіль рибалки збережено у Firestore.',
	'msg.recoverySuccess': 'Лист для відновлення пароля надіслано. Будь ласка, перевірте поштову скриньку.',
	'msg.signOutSuccess': 'Ви успішно вийшли з облікового запису.',
	'msg.googleSuccess': 'Успішно автентифіковано через Google! Профіль рибалки синхронізовано з Cloud Firestore.',

	// Tournaments Page
	'tourn.badge': 'MVP Сторінка 02',
	'tourn.category': 'Турнірна платформа',
	'tourn.title': 'Турніри та редактор турнірів',
	'tourn.desc': 'Огляд турнірів, правила, учасники, статус, результати та керування турнірами.',
	'tourn.createBtn': '+ Створити турнір',
	'tourn.submitCatchBtn': 'Подати вилов',
	'tourn.backToTournaments': 'Назад до турнірів',
	'tourn.saveTournament': 'Зберегти турнір',
	'tourn.saving': 'Збереження...',
	'tourn.tournamentsTab': 'Турніри',
	'tourn.subtabOverview': 'Огляд та інформація',
	'tourn.subtabList': 'Список турнірів',
	'tourn.subtabRules': 'Правила турніру',
	'tourn.subtabParticipants': 'Список учасників',
	'tourn.subtabStatus': 'Статус та розклад',
	'tourn.subtabLeaderboard': 'Таблиця лідерів та результати',
	'tourn.publishedHeading': 'Опубліковані турніри',
	'tourn.cloudLive': 'Cloud Firestore наживо',
	'tourn.statusActive': 'Активний',
	'tourn.targetLabel': 'Цільова риба:',
	'tourn.rulesLabel': 'Правила:',
	'tourn.refereeingBtn': 'Суддівство',
	'tourn.detailsBtn': 'Деталі',
	'tourn.emptyTitle': 'Ще немає опублікованих турнірів',
	'tourn.emptyDesc': 'Створіть свій перший турнір за допомогою форми, щоб опублікувати його у Cloud Firestore з локацією, видами риб та правилами CPR.',
	'tourn.phRulesTitle': 'Правила та регламент турніру',
	'tourn.phRulesDesc': 'Мінімальні розміри вилову, дозволені снасті, умови вилову за принципом «зловив-відпусти» та часові рамки будуть розміщені тут.',
	'tourn.phPartTitle': 'Список зареєстрованих рибалок',
	'tourn.phPartDesc': 'Профілі зареєстрованих рибалок, номери човнів, розподіл по секторах та статуси готовності.',
	'tourn.phStatusTitle': 'Статус наживо та розклад раундів',
	'tourn.phStatusDesc': 'Турнірний годинник, сигнали старту/фінішу, індикатори активних раундів та метеорологічні попередження.',
	'tourn.phLeadTitle': 'Таблиця лідерів та фінальні результати',
	'tourn.phLeadDesc': 'Підрахунок балів у реальному часі, загальна довжина/вага виловів, лідер у номінації за найбільшу рибу та призові місця.',
	'tourn.editorTitle': 'Редактор та налаштування турніру',
	'tourn.editorDesc': 'Заповніть форму нижче, щоб створити та опублікувати новий турнір зі спортивної риболовлі у Cloud Firestore.',
	'tourn.cancel': 'Скасувати',
	'tourn.fieldTitle': 'Назва турніру *',
	'tourn.phTitle': 'напр. Кубок Дністра з хижака 2026',
	'tourn.valTitle': 'Назва турніру є обовʼязковою.',
	'tourn.fieldHost': 'Клуб-організатор / Організація *',
	'tourn.phHost': 'напр. Федерація рибальського спорту SpotSport',
	'tourn.valHost': 'Клуб або організація є обовʼязковими.',
	'tourn.fieldWater': 'Водойма / Локація *',
	'tourn.phWater': 'напр. Басейн річки Дністер, Камʼянець-Подільський',
	'tourn.valWater': 'Локація або водойма є обовʼязковими.',
	'tourn.fieldDate': 'Дата турніру *',
	'tourn.valDate': 'Дата турніру є обовʼязковою.',
	'tourn.fieldSpecies': 'Цільові види риби *',
	'tourn.phSpecies': 'напр. Щука, Судак, Окунь',
	'tourn.valSpecies': 'Цільові види риби є обовʼязковими.',
	'tourn.fieldDesc': 'Опис турніру *',
	'tourn.phDesc': 'Опишіть формат змагань, категорії (човен/берег), квоти участі та графік реєстрації...',
	'tourn.valDesc': 'Опис турніру є обовʼязковим.',
	'tourn.fieldRules': 'Правила турніру та критерії валідації виловів *',
	'tourn.phRules': 'Вимоги формату CPR, мінімальна довжина риби, видимість вимірювальної лінійки, дозволені приманки та правила безпеки...',
	'tourn.valRules': 'Правила турніру є обовʼязковими.',
	'tourn.savingToFirestore': 'Збереження у Firestore...',
	'tourn.modalWater': 'Водойма:',
	'tourn.modalHost': 'Клуб-організатор:',
	'tourn.modalDate': 'Дата:',
	'tourn.modalSpecies': 'Цільові види:',
	'tourn.modalRules': 'Правила та вимоги «Зловив-Сфотографував-Відпусти»',
	'tourn.modalSubmitCatch': 'Подати вилов',
	'tourn.modalClose': 'Закрити',
	'tourn.detailsTitle': 'Огляд та деталі турніру',
	'tourn.detailsCategory': 'Керування турніром',
	'tourn.tabOverview': '1. Огляд та інформація',
	'tourn.tabRules': '2. Правила та регламент',
	'tourn.tabParticipants': '3. Список учасників',
	'tourn.tabLeaderboard': '4. Таблиця лідерів',
	'tourn.tournamentFormat': 'Формат та ідентифікація турніру',
	'tourn.venueInfo': 'Локація та водойма',
	'tourn.organizer': 'Організатор',
	'tourn.targetSpeciesLabel': 'Цільові види риб',
	'tourn.rulesOverview': 'Валідація виловів та правила',
	'tourn.scoringCriteria': 'Критерії оцінювання та коефіцієнти',
	'tourn.joinTournament': 'Приєднатися до турніру',
	'tourn.joining': 'Приєднання...',
	'tourn.alreadyJoined': 'Ви берете участь',
	'tourn.joinSuccess': 'Ви успішно приєдналися до турніру!',
	'tourn.alreadyRegistered': 'Ви вже зареєстровані учасником цього турніру.',
	'tourn.authRequiredToJoin': 'Будь ласка, увійдіть або зареєструйтесь, щоб приєднатися до турніру.',
	'tourn.joinError': 'Не вдалося приєднатися до турніру. Спробуйте ще раз.',
	'tourn.emptyParticipants': 'Ще немає зареєстрованих учасників. Станьте першим!',
	'tourn.shareQr': 'Поділитись / QR',
	'tourn.qrModalTitle': 'Поділитись турніром',
	'tourn.qrDirectUrl': 'Пряме посилання',
	'tourn.qrCopyLink': 'Скопіювати',
	'tourn.qrCopied': 'Скопійовано!',
	'tourn.qrClose': 'Закрити',
	'tourn.scanQr': 'Сканувати QR-код',
	'tourn.joinViaCode': 'Приєднатись за кодом / QR',
	'tourn.joinViaCodePlaceholder': 'Вставте URL турніру або ID…',
	'tourn.joinViaCodeBtn': 'Перейти до турніру',
	'tourn.scanModalTitle': 'Сканування QR турніру',
	'tourn.scanInstruction': 'Наведіть камеру на QR-код турніру SpotSport.',
	'tourn.scanError': 'Доступ до камери заборонено або недоступний.',
	'tourn.scanClose': 'Закрити сканер',

	// Refereeing Page
	'ref.badge': 'MVP Сторінка 03',
	'ref.category': 'Суддівство та вилови',
	'ref.title': 'Суддівство та верифікація виловів',
	'ref.desc': 'Подавайте вилови з фотографіями та вимірами, відстежуйте статус перевірки, переглядайте вилови, керуйте штрафами та спостерігайте за живою таблицею результатів.',
	'ref.catchModalBtn': 'Модальне вікно деталей вилову',
	'ref.switchToJudging': 'Перейти до суддівства',
	'ref.switchToCatch': 'Перейти до подання вилову',
	'ref.dialogTitle': 'Додатковий інтерфейс: Деталі вилову',
	'ref.dialogPlaceholder': 'Макет діалогового вікна',
	'ref.dialogPhotoText': 'Фото риби з вимірювальною лінійкою',
	'ref.dialogSpecies': 'Вид:',
	'ref.dialogLength': 'Довжина:',
	'ref.dialogWeight': 'Вага:',
	'ref.dialogSubmitted': 'Подано:',
	'ref.dialogOfflineSynced': '(Локальну офлайн-чергу синхронізовано)',
	'ref.dialogJudgeStatus': 'Статус судді:',
	'ref.dialogApprovedPts': 'Схвалено (+84.5 балів)',
	'ref.modeCatch': '1. Подання виловів (Вигляд рибалки)',
	'ref.modeJudging': '2. Суддівство та перевірка арбітром',
	'ref.subtabSubmit': 'Подати новий вилов',
	'ref.subtabStatus': 'Статус перевірки',
	'ref.subtabOffline': 'Офлайн-черга та синхронізація',
	'ref.phSubmitTitle': 'Форма подання фото та вимірювань',
	'ref.phSubmitDesc': 'Завантаження фотографій високої роздільної здатності з лінійкою, довжина риби в мм/см, вага та фіксація GPS-координат.',
	'ref.phStatusTitle': 'Трекер статусу перевірки виловів',
	'ref.phStatusDesc': 'Відстежує статус між Очікує перевірки, Прийнято суддею, Штрафні бали та Відхилено.',
	'ref.phOfflineTitle': 'Офлайн-сховище та механізм автосинхронізації',
	'ref.phOfflineDesc': 'Вилови зберігаються в локальній базі IndexedDB за слабкого звʼязку на воді, з автоматичною фоновою синхронізацією при відновленні мережі.',
	'ref.badgeCacheReady': 'Офлайн-кеш IndexedDB готовий',
	'ref.badgeGpsReady': 'Зчитування Exif дати та GPS готове',
	'ref.badgePushReady': 'Push-оновлення статусів готове',
	'ref.judgingTabReview': '1. Черга перевірки виловів',
	'ref.judgingTabPenalties': '2. Керування штрафами',
	'ref.judgingTabLeaderboard': '3. Моніторинг живої таблиці',
	'ref.phReviewTitle': 'Черга верифікації виловів',
	'ref.phReviewDesc': 'Вхідна черга виловів: перевірка лінійки на фото, порівняння, швидкі кнопки Схвалити (зелена) / Відхилити (червона) з вибором причини.',
	'ref.phPenaltiesTitle': 'Менеджер штрафів учасників',
	'ref.phPenaltiesDesc': 'Призначення жовтих карток, відрахування балів, санкції за порушення меж сектора або дискваліфікація з примітками судді.',
	'ref.phLeaderboardTitle': 'Керування таблицею результатів арбітра',
	'ref.phLeaderboardDesc': 'Панель арбітра з розподілом балів у реальному часі, миттєвим перерахунком, заморожуванням таблиці та історією аудиту.',
	'ref.badgeTwoJudge': 'Подвійний суддівський аудит готовий',
	'ref.badgeDispute': 'Протокол вирішення суперечок готовий',
	'ref.badgeSockets': 'Синхронізація через сокети готова',

	// About Page
	'about.badge': 'Про проєкт',
	'about.category': 'Платформа SpotSport',
	'about.title': 'Про SpotSport та розробника',
	'about.exploreTournaments': 'Переглянути турніри',
	'about.refereeingHub': 'Центр суддівства',
	'about.desc': 'SpotSport — це гібридна мобільна та веб-платформа для змагань зі спортивної риболовлі, фіксації виловів за принципом «Зловив-Сфотографував-Відпусти» (CPR), електронного суддівства та живих турнірних таблиць.',
	'about.creatorActive': 'Автор активний',
	'about.devResume': 'Резюме розробника',
	'about.conceptTitle': 'Про розробника та концепцію',
	'about.conceptText': 'Костя Олійник розробляє платформу SpotSport як сучасне рішення в рамках дисципліни "Гібридні мобільні додатки" в Кам\'янець-Подільському національному університеті імені Івана Огієнка. Проєкт поєднує можливості веб-технологій нового покоління (Angular 22, SSR) та мобільний досвід (PWA, офлайн-кешування виловів на водоймах), забезпечуючи чесне суддівство та прозорі результати для спільноти рибальського спорту.',
	'about.city': '📍 Кам\'янець-Подільський, Україна',
	'about.university': '🏛️ КПНУ ім. Івана Огієнка',
	'about.initiative': '🌐 Ініціатива IT-Kamianets',
	'about.capabilities': 'Можливості платформи',
	'about.modernizeTitle': 'Як SpotSport осучаснює турніри',
	'about.modernizeDesc': 'Створено для клубів спортивного рибальства, організаторів, суддів та спортсменів, яким потрібне прозоре та миттєве керування змаганнями.',
	'about.pillarCprTitle': 'Фіксація вилову (CPR)',
	'about.pillarCprDesc': 'Сучасна валідація виловів для спортивних рибальських змагань. Рибалки фіксують довжину, вагу, фотодокази та види з автоматичними мітками часу.',
	'about.pillarOfflineTitle': 'Робота в польових умовах офлайн',
	'about.pillarOfflineDesc': 'Розроблено для віддалених водойм та відкритих акваторій. Вилови надійно кешуються на пристрої та автоматично синхронізуються при відновленні звʼязку.',
	'about.pillarRefereeTitle': 'Суддівство та верифікація',
	'about.pillarRefereeDesc': 'Головні арбітри та судді перевіряють фотографії високої роздільної здатності, фіксують схвалення або причини відхилення та застосовують регламентні штрафи.',
	'about.pillarLeaderboardTitle': 'Живі турнірні таблиці',
	'about.pillarLeaderboardDesc': 'Автоматичний перерахунок балів у реальному часі надає глядачам, вболівальникам та учасникам миттєву видимість призових місць.',
	'about.techStackTitle': 'Інженерія та технологічний стек',
	'about.techStackDesc': 'Побудовано на базі передових веб-стандартів, що забезпечують високу швидкість, низьку затримку та плавне відображення на мобільних і компʼютерах.',
	'about.ctaTitle': 'Готові зануритися в платформу SpotSport?',
	'about.ctaDesc': 'Перегляньте актуальні турніри, ознайомтеся з процесом суддівства або налаштуйте свій профіль рибалки.',
	'about.ctaTournaments': 'Турніри',
	'about.ctaProfile': 'Профіль рибалки',
};

const STORAGE_KEY = 'spotsport_lang';

@Injectable({
	providedIn: 'root',
})
export class TranslationService {
	private readonly _platformId = inject(PLATFORM_ID);
	private readonly _isBrowser = isPlatformBrowser(this._platformId);

	public readonly availableLanguages = APP_LANGUAGES;
	public readonly currentLang = signal<AppLang>(this._getInitialLanguage());

	public readonly currentLangOption = computed(() => {
		const lang = this.currentLang();
		return this.availableLanguages.find((l) => l.code === lang) ?? this.availableLanguages[0]!;
	});

	private readonly _dictionaries: Record<AppLang, Record<string, string>> = {
		en: TRANSLATIONS_EN,
		uk: TRANSLATIONS_UK,
	};

	constructor() {
		// Sync HTML document lang on startup if browser
		if (this._isBrowser) {
			const initial = this.currentLang();
			document.documentElement.lang = initial;
		}
	}

	public setLanguage(lang: AppLang): void {
		this.currentLang.set(lang);

		if (this._isBrowser) {
			try {
				localStorage.setItem(STORAGE_KEY, lang);
				document.documentElement.lang = lang;
			} catch (e) {
				console.warn('Could not save language to localStorage:', e);
			}
		}
	}

	public getNextLanguage(): LanguageOption {
		const current = this.currentLang();
		const next = current === 'en' ? 'uk' : 'en';
		return this.availableLanguages.find((l) => l.code === next) ?? this.availableLanguages[0]!;
	}

	public t(key: string): string {
		const lang = this.currentLang();
		return this._dictionaries[lang]?.[key] ?? this._dictionaries['en']?.[key] ?? key;
	}

	private _getInitialLanguage(): AppLang {
		if (!this._isBrowser) {
			return 'en';
		}

		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved === 'uk' || saved === 'ua') {
				return 'uk';
			}
			if (saved === 'en') {
				return 'en';
			}
		} catch (e) {
			console.warn('Could not read language from localStorage:', e);
		}

		return 'en';
	}
}
