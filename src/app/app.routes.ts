import { Routes } from '@angular/router';
import { adminGuard, analistaTHGuard, liderGuard, autenticadoGuard } from './core/guards/role.guard';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    canActivate: [autenticadoGuard],
    loadComponent: () => import('./shared/components/dashboard-redirect/dashboard-redirect.component').then(m => m.DashboardRedirectComponent),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  {
    path: 'analista',
    canActivate: [analistaTHGuard],
    loadChildren: () => import('./features/analista-th/analista-th.routes').then(m => m.ANALISTA_TH_ROUTES),
  },
  {
    path: 'lider',
    canActivate: [liderGuard],
    loadChildren: () => import('./features/lider/lider.routes').then(m => m.LIDER_ROUTES),
  },
  { path: 'sin-acceso',  loadComponent: () => import('./shared/components/sin-acceso/sin-acceso.component').then(m => m.SinAccesoComponent) },
  { path: 'sin-permiso', loadComponent: () => import('./shared/components/sin-permiso/sin-permiso.component').then(m => m.SinPermisoComponent) },
  { path: '**', redirectTo: 'dashboard' },
];
