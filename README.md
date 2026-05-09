# Contratación App — Angular 20 + Angular Material + PnPjs

Aplicación SPA para la gestión del proceso de contratación, alojada en SharePoint.

## Stack
| Capa | Tecnología |
|------|-----------|
| Framework | Angular 20 · standalone components |
| UI | Angular Material 20 |
| SP Integration | @pnp/sp v4 (PnPjs) |
| Estilos | SCSS + Material theming |
| Auth | Sesión del navegador (cookies M365) |
| Formularios | Reactive Forms |
| Deploy | Biblioteca de documentos SharePoint |

## Estructura
```
src/app/
├── core/
│   ├── guards/role.guard.ts          # Guards por rol
│   └── services/
│       ├── auth.service.ts           # Usuario + rol (signals)
│       ├── pnp.config.ts             # PnPjs init
│       ├── sharepoint-base.service.ts # CRUD genérico
│       ├── notificacion.service.ts   # MatSnackBar wrapper
│       ├── sp-lists.constants.ts     # Nombres de listas
│       └── domain/index.ts           # Servicios por lista
├── shared/
│   ├── models/index.ts               # Interfaces TypeScript
│   └── components/
│       ├── layout/                   # Shell con sidenav Material
│       ├── dashboard-redirect/       # Redirige por rol
│       ├── sin-acceso/
│       └── sin-permiso/
└── features/
    ├── admin/                        # Usuarios, Aprobadores, Áreas
    ├── analista-th/                  # Solicitudes, Candidatos, Perfiles, Seguimiento
    └── lider/                        # Solicitudes aprobadas, Carta oferta, Seguimiento
```

## Instalación
```bash
npm install
```

## Configuración
Edita `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  sharepointSiteUrl: 'https://TUEMPRESA.sharepoint.com/sites/RRHH',
};
```

## Primer uso
1. Crea las listas en SharePoint según el modelo de datos
2. Agrega manualmente el primer Administrador en la lista `Roles_App`
3. Ejecuta `ng serve` — el navegador debe tener sesión activa en M365

## Build y deploy
```bash
ng build --configuration production
# Sube /dist/contratacion-app/browser/ a la biblioteca de SP
```

## Roles
| Rol | Módulo | Acceso |
|-----|--------|--------|
| Administrador | /admin | Usuarios, Aprobadores, Áreas |
| AnalistaTH | /analista | Solicitudes, Candidatos, Perfiles, Seguimiento |
| LiderArea | /lider | Solicitudes aprobadas, Carta oferta, Seguimiento |
