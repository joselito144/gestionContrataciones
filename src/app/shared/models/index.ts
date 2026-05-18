// ── Tipos utilitarios SP ──────────────────────────────────────────────────────
export interface SpPersona {
  Id: number;
  Title: string;
  EMail: string;
}

export interface SpLookup {
  Id: number;
  Title?: string;
}

// Lookup específico para PerfilesCargos — su campo título es 'Cargo'
export interface SpLookupPerfil {
  Id: number;
  Cargo?: string;
}

// ── Roles_App ─────────────────────────────────────────────────────────────────
export type RolApp = 'AnalistaTH' | 'LiderArea' | 'Administrador';

export interface RolAppItem {
  Id: number;
  Usuario: SpPersona;
  UsuarioId: number;
  Rol: RolApp;
  Activo: boolean;
}

export interface RolAppCreate {
  UsuarioId: number;
  Rol: RolApp;
  Activo: boolean;
}

// ── Aprobadores ───────────────────────────────────────────────────────────────
export type CargoAprobador =
  | 'Líder del Proceso'
  | 'Gerente'
  | 'Director Administrativo y Financiero';

export interface AprobadorItem {
  Id: number;
  Cargo: CargoAprobador;
  Persona: SpPersona;
  PersonaId: number;
  Orden: number;
  Activo: boolean;
}

export interface AprobadorCreate {
  Cargo: CargoAprobador;
  PersonaId: number;
  Orden: number;
  Activo: boolean;
}

// ── Areas ─────────────────────────────────────────────────────────────────────
export interface AreaItem {
  Id: number;
  Title: string;
  Descripcion: string;
}

export interface AreaCreate {
  Title: string;
  Descripcion: string;
}

// ── PerfilesCargos ────────────────────────────────────────────────────────────
export interface PerfilCargoItem {
  Id: number;
  Cargo: string;
  ExperienciaMinima: number;
  ComptenciasRequeridas: string;
  FormacionConocimiento: string;
}

export interface PerfilCargoCreate {
  Cargo: string;
  ExperienciaMinima: number;
  ComptenciasRequeridas: string;
  FormacionConocimiento: string;
}

// ── Solicitudes ───────────────────────────────────────────────────────────────
export type EstadoAprobacion = 'Pendiente' | 'Aprobado' | 'Rechazado';
export type NivelExcel       = 'No Aplica' | 'Básica' | 'Intermedia' | 'Avanzada';
export type MotivoVacante    =
  | 'Creación Cargo'
  | 'Renuncia'
  | 'Terminación Contrato'
  | 'Adición para Obra';

export interface SolicitudItem {
  Id: number;
  Pefil_solicitado: SpLookupPerfil;      // objeto lookup
  Pefil_solicitadoId: number;  
  Solicitante: SpPersona;
  SolicitanteId: number;
  AreaSolicitante: SpLookup;
  AreaSolicitanteId: number;
  Created: string;
  FechaRequeridaInicio: string;
  PruebaExcel: NivelExcel;
  MotivoVacante: MotivoVacante;
  Estado_Aprobacion: EstadoAprobacion;
  Aprobado_Lider: boolean;
  Aprobado_DirAdm: boolean;
  Aprobado_Gerente: boolean;
  Fecha_Aprobacion: string | null;
  Observaciones: string;
}

export interface SolicitudCreate {
  Pefil_solicitadoId: number; 
  AreaSolicitanteId: number;
  FechaRequeridaInicio: string;
  PruebaExcel: NivelExcel;
  MotivoVacante: MotivoVacante;
}

// ── Candidatos ────────────────────────────────────────────────────────────────
export type EstadoCandidato = 'En proceso' | 'Seleccionado' | 'Descartado';

export interface CandidatoItem {
  Id: number;
  ID_SolicitudId: number;
  ID_Solicitud: SpLookup;
  Nombre_Completo: string;
  Correo: string;
  Telefono: string;
  Estado: EstadoCandidato;
  Fecha_Ingreso: string;
  CV_URL: { Url: string; Description: string } | null;
  Examenes_OK: boolean;
  Notas_Analista: string;
}

export interface CandidatoCreate {
  ID_SolicitudId: number;
  Nombre_Completo: string;
  Correo: string;
  Telefono: string;
  Estado: EstadoCandidato;
  CV_URL?: { Url: string; Description: string };
  Examenes_OK: boolean;
  Notas_Analista: string;
}

// ── Ofertas ───────────────────────────────────────────────────────────────────
export type EstadoOferta = 'Enviada' | 'Aceptada' | 'Rechazada' | 'Vencida';

export interface OfertaItem {
  Id: number;
  ID_CandidatoId: number;
  ID_Candidato: SpLookup;
  Salario_Ofertado: number;
  Cargo: string;
  PDF_Oferta_URL: { Url: string; Description: string } | null;
  Estado_Oferta: EstadoOferta;
  Aprobada_DirAdm: boolean;
  Fecha_Envio: string | null;
  Fecha_Respuesta: string | null;
  IP_Aceptacion: string;
}

export interface OfertaCreate {
  ID_CandidatoId: number;
  Salario_Ofertado: number;
  Cargo: string;
  Estado_Oferta: EstadoOferta;
  Aprobada_DirAdm: boolean;
}

// ── Contratos ─────────────────────────────────────────────────────────────────
export type EstadoFirma = 'Pendiente' | 'Firmado_Asp' | 'Completado' | 'Error';

export interface ContratoItem {
  Id: number;
  ID_OfertaId: number;
  ID_Oferta: SpLookup;
  DocuSign_EnvelopeID: string;
  Estado_Firma: EstadoFirma;
  Fecha_Envio_DocuSign: string | null;
  Fecha_Firma_Aspirante: string | null;
  Fecha_Firma_RepLegal: string | null;
  PDF_Firmado_URL: { Url: string; Description: string } | null;
  Certificado_Auditoria: { Url: string; Description: string } | null;
  Archivado: boolean;
}

export interface ContratoCreate {
  ID_OfertaId: number;
  DocuSign_EnvelopeID: string;
  Estado_Firma: EstadoFirma;
}

// ── Usuario actual ────────────────────────────────────────────────────────────
export interface UsuarioActual {
  id: number;
  nombre: string;
  email: string;
  rol: RolApp | null;
  activo: boolean;
}
