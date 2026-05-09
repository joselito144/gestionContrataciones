import { Component } from '@angular/core';
// import { LayoutShellComponent, NavItem } from '../../../shared/components/layout/layout-shell.component';
import { LayoutShellComponent, NavItem } from '../../../shared/components/layout/layout-shell.component';

const NAV: NavItem[] = [
  { label: 'Usuarios',    icon: 'manage_accounts', route: '/admin/usuarios' },
  { label: 'Aprobadores', icon: 'approval',        route: '/admin/aprobadores' },
  { label: 'Áreas',       icon: 'business',        route: '/admin/areas' },
];

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [LayoutShellComponent],
  template: `<app-layout-shell [navItems]="nav" rolLabel="Administrador" />`,
})
export class AdminShellComponent { nav = NAV; }
