import { Routes } from '@angular/router';

export const LIDER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./lider-shell/lider-shell.component').then(m => m.LiderShellComponent),
    children: [
      { path: '', redirectTo: 'solicitudes', pathMatch: 'full' },
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('./solicitudes/lider-solicitudes.component').then(m => m.LiderSolicitudFormComponent),
      },
      {
        path: 'solicitudes/nueva',
        loadComponent: () =>
          import('./solicitudes-form/lider-solicitud-form.component').then(m => m.LiderSolicitudFormComponent),
      },
    ],
  },
];