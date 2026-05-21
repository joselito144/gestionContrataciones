import { Routes } from '@angular/router';

export const ANALISTA_TH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./analista-shell/analista-shell.component').then(m => m.AnalistaShellComponent),
    children: [
      { path: '', redirectTo: 'solicitudes', pathMatch: 'full' },

      // Solicitudes — vista pipeline (solo lectura para el analista)
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('./solicitudes/solicitudes.component').then(m => m.SolicitudesComponent),
      },

      // Candidatos — catálogo maestro
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
        path: 'candidatos/:id/procesos',
        loadComponent: () =>
          import('./candidatos/candidato-procesos.component').then(m => m.CandidatoProcesosComponent),
      },

      // Participaciones — vinculación candidato ↔ solicitud
      {
        path: 'participaciones/nueva',
        loadComponent: () =>
          import('./participaciones/participacion-form.component').then(m => m.ParticipacionFormComponent),
      },

      // Carta oferta — desde participación seleccionada
      {
        path: 'participaciones/:id/oferta',
        loadComponent: () =>
          import('./carta-oferta/carta-oferta-form.component').then(m => m.CartaOfertaFormComponent),
      },

      // Perfiles/cargos
      {
        path: 'perfiles-cargos',
        loadComponent: () =>
          import('./perfiles-cargos/perfiles-cargos.component').then(m => m.PerfilesCargosComponent),
      },

      // Seguimiento
      {
        path: 'seguimiento',
        loadComponent: () =>
          import('./seguimiento/seguimiento.component').then(m => m.SeguimientoComponent),
      },
    ],
  },
];