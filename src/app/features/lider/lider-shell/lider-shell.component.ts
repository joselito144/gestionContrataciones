import { Component } from '@angular/core';
import { LayoutShellComponent, NavItem } from '../../../shared/components/layout/layout-shell.component';

const NAV: NavItem[] = [
  { label: 'Solicitudes aprobadas', icon: 'assignment_turned_in', route: '/lider/solicitudes' },
  { label: 'Seguimiento',           icon: 'track_changes',        route: '/lider/seguimiento' },
];

@Component({
  selector: 'app-lider-shell',
  standalone: true,
  imports: [LayoutShellComponent],
  template: `<app-layout-shell [navItems]="nav" rolLabel="Líder de área" />`,
})
export class LiderShellComponent { nav = NAV; }
