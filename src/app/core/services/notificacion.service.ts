import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private snack = inject(MatSnackBar);

  exito(msg: string)     { this.snack.open(msg, 'Cerrar', { duration: 3500, panelClass: 'snack-success' }); }
  error(msg: string)     { this.snack.open(msg, 'Cerrar', { duration: 5000, panelClass: 'snack-error' }); }
  advertencia(msg: string) { this.snack.open(msg, 'Cerrar', { duration: 4000, panelClass: 'snack-warn' }); }
}
