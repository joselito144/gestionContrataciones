import { Routes } from '@angular/router';

export const ANALISTA_TH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./analista-shell/analista-shell.component').then(m => m.AnalistaShellComponent),
    children: [
      { path: '', redirectTo: 'solicitudes', pathMatch: 'full' },
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('./solicitudes/solicitudes.component').then(m => m.SolicitudesComponent),
      },
      {
        path: 'candidatos',
        loadComponent: () =>
          import('./candidatos/candidatos-list.component').then(m => m.CandidatosListComponent),
      },
      {
        path: 'candidatos/nuevo',
        loadComponent: () =>
          import('./candidatos/candidato-form.component').then(m => m.CandidatoFormComponent),
      },
      {
        path: 'candidatos/:id',
        loadComponent: () =>
          import('./candidatos/candidato-form.component').then(m => m.CandidatoFormComponent),
      },
      {
        path: 'candidatos/:id/oferta',
        loadComponent: () =>
          import('./carta-oferta/carta-oferta-form.component').then(m => m.CartaOfertaFormComponent),
      },
      {
        path: 'perfiles-cargos',
        loadComponent: () =>
          import('./perfiles-cargos/perfiles-cargos.component').then(m => m.PerfilesCargosComponent),
      },
      {
        path: 'seguimiento',
        loadComponent: () =>
          import('./seguimiento/seguimiento.component').then(m => m.SeguimientoComponent),
      },
    ],
  },
];