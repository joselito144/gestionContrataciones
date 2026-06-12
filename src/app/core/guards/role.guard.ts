import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AprobadoresService } from '../services/domain';
import { RolApp } from '../../shared/models';

// ── Guards por rol ────────────────────────────────────────────────────────────

export function rolGuard(...roles: RolApp[]): CanActivateFn {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);
    if (!auth.tieneAcceso())         return router.createUrlTree(['/sin-acceso']);
    if (roles.includes(auth.rol()!)) return true;
    return router.createUrlTree(['/sin-permiso']);
  };
}

export const adminGuard:       CanActivateFn = rolGuard('Administrador');
export const analistaTHGuard:  CanActivateFn = rolGuard('AnalistaTH', 'Administrador');
export const liderGuard:       CanActivateFn = rolGuard('LiderArea', 'Administrador');
export const autenticadoGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  return auth.tieneAcceso() ? true : router.createUrlTree(['/sin-acceso']);
};

// ── Guard de aprobador — Nivel 2 ─────────────────────────────────────────────
// Verifica que el usuario actual esté registrado como aprobador activo
// en la lista Aprobadores de SharePoint.
// Úsalo en rutas que correspondan a acciones de aprobación.

export const aprobadorGuard: CanActivateFn = () => {
  const auth      = inject(AuthService);
  const aprobSvc  = inject(AprobadoresService);
  const router    = inject(Router);

  // Primero verifica acceso general a la app
  if (!auth.tieneAcceso()) return router.createUrlTree(['/sin-acceso']);

  const emailActual = auth.usuario()?.email?.toLowerCase() ?? '';

  return aprobSvc.getActivos().pipe(
    map(aprobadores => {
      const esAprobador = aprobadores.some(
        a => a.Persona.EMail.toLowerCase() === emailActual
      );
      if (esAprobador) return true;
      return router.createUrlTree(['/sin-permiso']);
    }),
    catchError(() => of(router.createUrlTree(['/sin-permiso'])))
  );
};

// ── Guard combinado: rol + aprobador ─────────────────────────────────────────
// Para rutas donde se requiere un rol específico Y ser aprobador registrado.
// Ejemplo: un Administrador que no esté en Aprobadores no debería aprobar.

export function rolYAprobadorGuard(...roles: RolApp[]): CanActivateFn {
  return () => {
    const auth      = inject(AuthService);
    const aprobSvc  = inject(AprobadoresService);
    const router    = inject(Router);

    if (!auth.tieneAcceso())          return of(router.createUrlTree(['/sin-acceso']));
    if (!roles.includes(auth.rol()!)) return of(router.createUrlTree(['/sin-permiso']));

    const emailActual = auth.usuario()?.email?.toLowerCase() ?? '';

    return aprobSvc.getActivos().pipe(
      map(aprobadores => {
        const esAprobador = aprobadores.some(
          a => a.Persona.EMail.toLowerCase() === emailActual
        );
        return esAprobador ? true : router.createUrlTree(['/sin-permiso']);
      }),
      catchError(() => of(router.createUrlTree(['/sin-permiso'])))
    );
  };
}