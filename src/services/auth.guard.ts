import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from './user.service';

export const authGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  // FIX: Explicitly type `router` to avoid type inference issues.
  const router: Router = inject(Router);

  if (userService.isLoggedIn()) {
    return true;
  }

  // Redirect to the login page
  return router.parseUrl('/auth');
};