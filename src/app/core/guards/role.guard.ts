import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RolApp } from '../../shared/models';

export function rolGuard(...roles: RolApp[]): CanActivateFn {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);
    if (!auth.tieneAcceso())           return router.createUrlTree(['/sin-acceso']);
    if (roles.includes(auth.rol()!))   return true;
    return router.createUrlTree(['/sin-permiso']);
  };
}

export const adminGuard:      CanActivateFn = rolGuard('Administrador');
export const analistaTHGuard: CanActivateFn = rolGuard('AnalistaTH', 'Administrador');
export const liderGuard:      CanActivateFn = rolGuard('LiderArea', 'Administrador');
export const autenticadoGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  return auth.tieneAcceso() ? true : router.createUrlTree(['/sin-acceso']);
};
