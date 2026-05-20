import { Component } from '@angular/core';
import { LayoutShellComponent, NavItem } from '../../../shared/components/layout/layout-shell.component';

const NAV: NavItem[] = [
  { label: 'Solicitudes',     icon: 'assignment',     route: '/analista/solicitudes' },
  { label: 'Candidatos',      icon: 'people',         route: '/analista/candidatos' },
  { label: 'Carta oferta',    icon: 'description',    route: '/analista/candidatos' },
  { label: 'Perfiles/Cargos', icon: 'work',           route: '/analista/perfiles-cargos' },
  { label: 'Seguimiento',     icon: 'track_changes',  route: '/analista/seguimiento' },
];

@Component({
  selector: 'app-analista-shell',
  standalone: true,
  imports: [LayoutShellComponent],
  template: `<app-layout-shell [navItems]="nav" rolLabel="Analista TH" />`,
})
export class AnalistaShellComponent { nav = NAV; }