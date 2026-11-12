import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Functional Route Guard that protects private routes.
 * Redirects unauthenticated users to /login preserving the returnUrl query param.
 */
export const authGuard: CanActivateFn = (_route, state) => {
	const platformId = inject(PLATFORM_ID);
	// Allow SSR / prerender pass-through to generate shell safely
	if (isPlatformServer(platformId)) {
		return true;
	}

	const authService = inject(AuthService);
	const router = inject(Router);

	return authService.authState$.pipe(
		take(1),
		map((user) => {
			if (user) {
				return true;
			}

			return router.createUrlTree(['/login'], {
				queryParams: { returnUrl: state.url },
			});
		}),
	);
};
