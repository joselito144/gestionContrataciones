import { Injectable, signal, computed } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { PnpConfigService } from './pnp.config';
import { SP_LISTS } from './sp-lists.constants';
import { RolApp, RolAppItem, UsuarioActual } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _usuario  = signal<UsuarioActual | null>(null);
  private _cargando = signal<boolean>(false);
  private _error    = signal<string | null>(null);

  readonly usuario  = this._usuario.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error    = this._error.asReadonly();

  readonly rol             = computed(() => this._usuario()?.rol ?? null);
  readonly esAnalistaTH    = computed(() => this.rol() === 'AnalistaTH');
  readonly esLider         = computed(() => this.rol() === 'LiderArea');
  readonly esAdministrador = computed(() => this.rol() === 'Administrador');
  readonly tieneAcceso     = computed(() => !!this._usuario()?.activo && this.rol() !== null);

  readonly iniciales = computed(() => {
    const nombre = this._usuario()?.nombre ?? '';
    const partes  = nombre.trim().split(' ');
    return partes.length >= 2
      ? (partes[0][0] + partes[1][0]).toUpperCase()
      : nombre.substring(0, 2).toUpperCase();
  });

  constructor(private pnp: PnpConfigService) {}

  inicializar(): Observable<UsuarioActual | null> {
    this._cargando.set(true);
    this._error.set(null);
    return from(this._cargar()).pipe(
      tap(u => { this._usuario.set(u); this._cargando.set(false); }),
      catchError(err => {
        console.error('[AuthService]', err);
        this._error.set('No se pudo verificar el acceso. Contacta al administrador.');
        this._cargando.set(false);
        return of(null);
      })
    );
  }

  private async _cargar(): Promise<UsuarioActual | null> {
    const spUser = await this.pnp.sp.web.currentUser();
    if (!spUser?.Email) throw new Error('Usuario SP no disponible');

    const roles = await this.pnp.sp.web
      .lists.getByTitle(SP_LISTS.ROLES_APP)
      .items
      .select('Id', 'Rol', 'Activo', 'Usuario/Id', 'Usuario/Title', 'Usuario/EMail')
      .expand('Usuario')
      .filter(`Usuario/EMail eq '${spUser.Email}'`)
      .top(1)() as RolAppItem[];

    if (!roles?.length) {
      return { id: spUser.Id, nombre: spUser.Title, email: spUser.Email, rol: null, activo: false };
    }

    const r = roles[0];
    return {
      id: spUser.Id,
      nombre: spUser.Title,
      email: spUser.Email,
      rol: r.Activo ? r.Rol : null,
      activo: r.Activo,
    };
  }
}
