import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SharepointBaseService } from '../sharepoint-base.service';
import { SP_LISTS } from '../sp-lists.constants';
import {
  RolAppItem, RolAppCreate, RolApp,
  AprobadorItem, AprobadorCreate,
  AreaItem, AreaCreate,
  CentroCostoItem,
  PerfilCargoItem, PerfilCargoCreate,
  SolicitudItem, SolicitudCreate,
  CandidatoItem, CandidatoCreate,
  ParticipacionItem, ParticipacionCreate, EstadoParticipacion,
  OfertaItem, OfertaCreate,
  ContratoItem, ContratoCreate,
  PlantillaDocumentoItem,
} from '../../../shared/models';

// ── RolesApp ──────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class RolesAppService {
  private sp = inject(SharepointBaseService);
  private S = ['Id', 'Rol', 'Activo', 'Usuario/Id', 'Usuario/Title', 'Usuario/EMail'];
  private E = ['Usuario'];

  getAll(): Observable<RolAppItem[]> {
    return this.sp.getAll<RolAppItem>(SP_LISTS.ROLES_APP, { select: this.S, expand: this.E, orderBy: 'Usuario/Title' });
  }
  create(data: RolAppCreate): Observable<any> {
    return this.sp.create(SP_LISTS.ROLES_APP, data as any);
  }
  update(id: number, data: Partial<RolAppCreate>): Observable<any> {
    return this.sp.update(SP_LISTS.ROLES_APP, id, data as any);
  }
  toggleActivo(id: number, activo: boolean): Observable<any> {
    return this.sp.update(SP_LISTS.ROLES_APP, id, { Activo: activo });
  }
  cambiarRol(id: number, rol: RolApp): Observable<any> {
    return this.sp.update(SP_LISTS.ROLES_APP, id, { Rol: rol });
  }
}

// ── Aprobadores ───────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AprobadoresService {
  private sp = inject(SharepointBaseService);
  private S = ['Id', 'Cargo', 'Orden', 'Activo', 'Persona/Id', 'Persona/Title', 'Persona/EMail'];
  private E = ['Persona'];

  getAll(): Observable<AprobadorItem[]> {
    return this.sp.getAll<AprobadorItem>(SP_LISTS.APROBADORES, { select: this.S, expand: this.E, orderBy: 'Orden', ascending: true });
  }
  getActivos(): Observable<AprobadorItem[]> {
    return this.sp.getAll<AprobadorItem>(SP_LISTS.APROBADORES, {
      select: this.S, expand: this.E,
      filter: 'Activo eq true', orderBy: 'Orden', ascending: true,
    });
  }
  create(data: AprobadorCreate): Observable<any> {
    return this.sp.create(SP_LISTS.APROBADORES, data as any);
  }
  update(id: number, data: Partial<AprobadorCreate>): Observable<any> {
    return this.sp.update(SP_LISTS.APROBADORES, id, data as any);
  }
  toggleActivo(id: number, activo: boolean): Observable<any> {
    return this.sp.update(SP_LISTS.APROBADORES, id, { Activo: activo });
  }
  delete(id: number): Observable<void> {
    return this.sp.delete(SP_LISTS.APROBADORES, id);
  }
}

// ── Areas ─────────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AreasService {
  private sp = inject(SharepointBaseService);

  getAll(): Observable<AreaItem[]> {
    return this.sp.getAll<AreaItem>(SP_LISTS.AREAS, {
      select: ['Id', 'Title', 'Descripcion'], orderBy: 'Title',
    });
  }
  create(data: AreaCreate): Observable<any> {
    return this.sp.create(SP_LISTS.AREAS, { Title: data.Title, Descripcion: data.Descripcion });
  }
  update(id: number, data: Partial<AreaCreate>): Observable<any> {
    return this.sp.update(SP_LISTS.AREAS, id, data as any);
  }
  delete(id: number): Observable<void> {
    return this.sp.delete(SP_LISTS.AREAS, id);
  }
}

// ── CentroCostos ──────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class CentroCostosService {
  private sp = inject(SharepointBaseService);

  getAll(): Observable<CentroCostoItem[]> {
    return this.sp.getAll<CentroCostoItem>(SP_LISTS.CENTROS_COSTO, {
      select: ['Id', 'Title', 'NombreCentroCostos'], orderBy: 'Title',
    });
  }
}

// ── PerfilesCargos ────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class PerfilesCargosService {
  private sp = inject(SharepointBaseService);
  private S = ['Id', 'Cargo', 'ExperienciaMinima', 'ComptenciasRequeridas', 'FormacionConocimiento'];

  getAll(): Observable<PerfilCargoItem[]> {
    return this.sp.getAll<PerfilCargoItem>(SP_LISTS.PERFILES_CARGOS, { select: this.S, orderBy: 'Cargo' });
  }
  getById(id: number): Observable<PerfilCargoItem> {
    return this.sp.getById<PerfilCargoItem>(SP_LISTS.PERFILES_CARGOS, id, { select: this.S });
  }
  create(data: PerfilCargoCreate): Observable<any> {
    return this.sp.create(SP_LISTS.PERFILES_CARGOS, data as any);
  }
  update(id: number, data: Partial<PerfilCargoCreate>): Observable<any> {
    return this.sp.update(SP_LISTS.PERFILES_CARGOS, id, data as any);
  }
  delete(id: number): Observable<void> {
    return this.sp.delete(SP_LISTS.PERFILES_CARGOS, id);
  }
}

// ── Solicitudes ───────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  private sp = inject(SharepointBaseService);
  private S = [
    'Id', 'FechaRequeridaInicio', 'Created',
    'PruebaExcel', 'MotivoVacante', 'Estado_Aprobacion',
    'Aprobado_Lider', 'Aprobado_DirAdm', 'Aprobado_Gerente',
    'Fecha_Aprobacion', 'Observaciones',
    'JefeInmediato', 'RangoSalario', 'ElementosNecesarios', 'AmpliarPerfilCargo',
    'TrabajoAlturasVigente', 'TipoContrato', 'DuracionContrato',
    'UnidadDuracionContrato', 'DefinicionObjetoObra',
    // SP REST v1 solo permite Id y el campo título (Cargo) en expand de lookup
    // Los demás campos del perfil se cargan por separado con PerfilesCargosService.getById()
    'Pefil_solicitado/Id', 'Pefil_solicitado/Cargo',
    'Solicitante/Id', 'Solicitante/Title', 'Solicitante/EMail',
    'AreaSolicitante/Id', 'AreaSolicitante/Title',
    'CentroCosto/Id', 'CentroCosto/Title',
  ];
  private E = ['Solicitante', 'AreaSolicitante', 'Pefil_solicitado', 'CentroCosto'];

  getAll(): Observable<SolicitudItem[]> {
    return this.sp.getAll<SolicitudItem>(SP_LISTS.SOLICITUDES, {
      select: this.S, expand: this.E,
      orderBy: 'Created', ascending: false,
    });
  }
  getById(id: number): Observable<SolicitudItem> {
    return this.sp.getById<SolicitudItem>(SP_LISTS.SOLICITUDES, id, { select: this.S, expand: this.E });
  }
  getAprobadas(): Observable<SolicitudItem[]> {
    return this.sp.getAll<SolicitudItem>(SP_LISTS.SOLICITUDES, {
      select: this.S, expand: this.E,
      filter: `Estado_Aprobacion eq 'Aprobado'`,
      orderBy: 'Fecha_Aprobacion', ascending: false,
    });
  }
  getBySolicitante(email: string): Observable<SolicitudItem[]> {
    return this.sp.getAll<SolicitudItem>(SP_LISTS.SOLICITUDES, {
      select: this.S, expand: this.E,
      filter: `Solicitante/EMail eq '${email}'`,
      orderBy: 'Created', ascending: false,
    });
  }
  create(data: SolicitudCreate): Observable<any> {
    return this.sp.create(SP_LISTS.SOLICITUDES, {
      ...data,
      Estado_Aprobacion: 'Pendiente',
      Aprobado_Lider: false,
      Aprobado_DirAdm: false,
      Aprobado_Gerente: false,
    });
  }
  update(id: number, data: Partial<SolicitudItem>): Observable<any> {
    return this.sp.update(SP_LISTS.SOLICITUDES, id, data as any);
  }
  progreso(s: SolicitudItem): number {
    return (s.Aprobado_DirAdm ? 1 : 0) + (s.Aprobado_Gerente ? 1 : 0);
  }
}

// ── Candidatos ────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class CandidatosService {
  private sp = inject(SharepointBaseService);
  private S = [
    'Id', 'Nombre_Completo', 'TipoIdentificacion', 'NumeroIdentificacion',
    'Correo', 'Telefono', 'Direccion', 'Notas_Analista',
    'FechaExpedicionDoc', 'CiudadExpedicionDoc',
    'FechaNacimiento', 'CiudadNacimiento',
    'EstadoCivil', 'Escolaridad', 'GrupoSanguineo', 'TipoVivienda',
    'Estrato', 'Barrio', 'EPS', 'Pension', 'NumeroCuenta', 'Banco',
  ];

  getAll(): Observable<CandidatoItem[]> {
    return this.sp.getAll<CandidatoItem>(SP_LISTS.CANDIDATOS, {
      select: this.S, orderBy: 'Nombre_Completo',
    });
  }
  getById(id: number): Observable<CandidatoItem> {
    return this.sp.getById<CandidatoItem>(SP_LISTS.CANDIDATOS, id, { select: this.S });
  }
  create(data: CandidatoCreate): Observable<any> {
    return this.sp.create(SP_LISTS.CANDIDATOS, data as any);
  }
  update(id: number, data: Partial<CandidatoItem>): Observable<any> {
    return this.sp.update(SP_LISTS.CANDIDATOS, id, data as any);
  }
}

// ── Participaciones ───────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ParticipacionesService {
  private sp = inject(SharepointBaseService);
  private S = [
    'Id', 'Estado', 'Fecha_Ingreso', 'Examenes_OK', 'Notas_Proceso',
    'CandidatoId', 'SolicitudId',
    'Candidato/Id', 'Candidato/Title', 'Candidato/Nombre_Completo',
    'Solicitud/Id', 'Solicitud/Title',
  ];
  private E = ['Candidato', 'Solicitud'];

  getBySolicitud(solicitudId: number): Observable<ParticipacionItem[]> {
    return this.sp.getAll<ParticipacionItem>(SP_LISTS.PARTICIPACIONES, {
      select: this.S, expand: this.E,
      filter: `SolicitudId eq ${solicitudId}`,
      orderBy: 'Fecha_Ingreso', ascending: false,
    });
  }
  getByCandidato(candidatoId: number): Observable<ParticipacionItem[]> {
    return this.sp.getAll<ParticipacionItem>(SP_LISTS.PARTICIPACIONES, {
      select: this.S, expand: this.E,
      filter: `CandidatoId eq ${candidatoId}`,
      orderBy: 'Fecha_Ingreso', ascending: false,
    });
  }
  getSeleccionadosBySolicitud(solicitudId: number): Observable<ParticipacionItem[]> {
    return this.sp.getAll<ParticipacionItem>(SP_LISTS.PARTICIPACIONES, {
      select: this.S, expand: this.E,
      filter: `SolicitudId eq ${solicitudId} and Estado eq 'Seleccionado'`,
    });
  }
  getById(id: number): Observable<ParticipacionItem> {
    return this.sp.getById<ParticipacionItem>(SP_LISTS.PARTICIPACIONES, id, {
      select: this.S, expand: this.E,
    });
  }
  create(data: ParticipacionCreate): Observable<any> {
    return this.sp.create(SP_LISTS.PARTICIPACIONES, {
      ...data,
      Fecha_Ingreso: new Date().toISOString(),
    });
  }
  update(id: number, data: Partial<ParticipacionCreate>): Observable<any> {
    return this.sp.update(SP_LISTS.PARTICIPACIONES, id, data as any);
  }
  cambiarEstado(id: number, estado: EstadoParticipacion): Observable<any> {
    return this.sp.update(SP_LISTS.PARTICIPACIONES, id, { Estado: estado });
  }
  existeParticipacion(candidatoId: number, solicitudId: number): Observable<ParticipacionItem[]> {
    return this.sp.getAll<ParticipacionItem>(SP_LISTS.PARTICIPACIONES, {
      select: ['Id'],
      filter: `CandidatoId eq ${candidatoId} and SolicitudId eq ${solicitudId}`,
      top: 1,
    });
  }
}

// ── Ofertas ───────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class OfertasService {
  private sp = inject(SharepointBaseService);
  private S = [
    'Id', 'Salario_Ofertado', 'Cargo', 'PDF_Oferta_URL',
    'Estado_Oferta', 'AplicaKPI', 'Aprobada_DirAdm',
    'Fecha_Envio', 'Fecha_Respuesta', 'IP_Aceptacion',
    'ID_Participacion/Id',
  ];
  private E = ['ID_Participacion'];

  getAll(): Observable<OfertaItem[]> {
    return this.sp.getAll<OfertaItem>(SP_LISTS.OFERTAS, {
      select: this.S, expand: this.E,
      orderBy: 'Fecha_Envio', ascending: false,
    });
  }

  // NUEVO: consulta puntual de una oferta por su Id — usado en oferta-detalle.component
  getById(id: number): Observable<OfertaItem> {
    return this.sp.getById<OfertaItem>(SP_LISTS.OFERTAS, id, {
      select: this.S, expand: this.E,
    });
  }

  getByParticipacion(participacionId: number): Observable<OfertaItem[]> {
    return this.sp.getAll<OfertaItem>(SP_LISTS.OFERTAS, {
      select: this.S, expand: this.E,
      filter: `ID_ParticipacionId eq ${participacionId}`,
      orderBy: 'Id', ascending: false,
    });
  }

  // NUEVO: trae las ofertas de VARIAS participaciones en una sola consulta.
  // Evita hacer N peticiones cuando se listan participaciones de una solicitud
  // o de un candidato. Usado en solicitudes.component y candidato-procesos.component
  // para mostrar el estado de oferta y prevenir el envío de ofertas duplicadas.
  getByParticipaciones(participacionIds: number[]): Observable<OfertaItem[]> {
    if (!participacionIds.length) return of([]);
    const filtro = participacionIds.map(id => `ID_ParticipacionId eq ${id}`).join(' or ');
    return this.sp.getAll<OfertaItem>(SP_LISTS.OFERTAS, {
      select: this.S, expand: this.E,
      filter: filtro,
    });
  }

  create(data: OfertaCreate): Observable<any> {
    return this.sp.create(SP_LISTS.OFERTAS, data as any);
  }
  update(id: number, data: Partial<OfertaItem>): Observable<any> {
    return this.sp.update(SP_LISTS.OFERTAS, id, data as any);
  }
}

// ── Contratos ─────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ContratosService {
  private sp = inject(SharepointBaseService);
  private S = [
    'Id', 'DocuSign_EnvelopeID', 'Estado_Firma',
    'Fecha_Envio_DocuSign', 'Fecha_Firma_Aspirante', 'Fecha_Firma_RepLegal',
    'PDF_Firmado_URL', 'Certificado_Auditoria', 'Archivado',
    'ID_Oferta/Id',
  ];
  private E = ['ID_Oferta'];

  getByOferta(ofertaId: number): Observable<ContratoItem[]> {
    return this.sp.getAll<ContratoItem>(SP_LISTS.CONTRATOS, {
      select: this.S, expand: this.E,
      filter: `ID_OfertaId eq ${ofertaId}`,
    });
  }
  create(data: ContratoCreate): Observable<any> {
    return this.sp.create(SP_LISTS.CONTRATOS, data as any);
  }
  update(id: number, data: Partial<ContratoItem>): Observable<any> {
    return this.sp.update(SP_LISTS.CONTRATOS, id, data as any);
  }
}

// ── PlantillasDocumento ───────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class PlantillasDocumentoService {
  private sp = inject(SharepointBaseService);
  private S = ['Id', 'Title', 'NombreArchivo', 'Activo', 'Orden'];

  getActivas(): Observable<PlantillaDocumentoItem[]> {
    return this.sp.getAll<PlantillaDocumentoItem>(SP_LISTS.PLANTILLAS_DOCUMENTO, {
      select:    this.S,
      filter:    'Activo eq 1',
      orderBy:   'Orden',
      ascending: true,
    });
  }

  getAll(): Observable<PlantillaDocumentoItem[]> {
    return this.sp.getAll<PlantillaDocumentoItem>(SP_LISTS.PLANTILLAS_DOCUMENTO, {
      select:  this.S,
      orderBy: 'Orden',
    });
  }

  create(data: Omit<PlantillaDocumentoItem, 'Id'>): Observable<any> {
    return this.sp.create(SP_LISTS.PLANTILLAS_DOCUMENTO, data as any);
  }

  update(id: number, data: Partial<PlantillaDocumentoItem>): Observable<any> {
    return this.sp.update(SP_LISTS.PLANTILLAS_DOCUMENTO, id, data as any);
  }

  toggleActivo(id: number, activo: boolean): Observable<any> {
    return this.sp.update(SP_LISTS.PLANTILLAS_DOCUMENTO, id, { Activo: activo });
  }

  delete(id: number): Observable<void> {
    return this.sp.delete(SP_LISTS.PLANTILLAS_DOCUMENTO, id);
  }
}