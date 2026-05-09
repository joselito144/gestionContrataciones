import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    // loadComponent: () => import('./admin-shell/admin-shell.component').then(m => m.AdminShellComponent),
    loadComponent: () => import ('./admin-shell/admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
      { path: 'usuarios',    loadComponent: () => import('./usuarios/usuarios.component').then(m => m.UsuariosComponent) },
      { path: 'aprobadores', loadComponent: () => import('./aprobadores/aprobadores.component').then(m => m.AprobadoresComponent) },
      { path: 'areas',       loadComponent: () => import('./areas/areas.component').then(m => m.AreasComponent) },
    ],
  },
];
