import { Component } from '@angular/core';
import { LayoutShellComponent, NavItem } from '../../../shared/components/layout/layout-shell.component';

const NAV: NavItem[] = [
  { label: 'Nueva solicitud',       icon: 'add_circle_outline',    route: '/lider/solicitudes/nueva' },
  { label: 'Mis solicitudes',       icon: 'assignment',            route: '/lider/solicitudes' },
  { label: 'Seguimiento ofertas',   icon: 'track_changes',         route: '/lider/seguimiento' },
];

@Component({
  selector: 'app-lider-shell',
  standalone: true,
  imports: [LayoutShellComponent],
  template: `<app-layout-shell [navItems]="nav" rolLabel="Líder de área" />`,
})
export class LiderShellComponent { nav = NAV; }