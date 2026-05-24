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

export interface SpLookupPerfil {
  Id: number;
  Cargo?: string;
}

export interface CentroCostoItem {
  Id: number;
  Title: string;
  NombreCentroCostos: string;
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
export type TipoContrato =
  | 'Término Indefinido'
  | 'Término Fijo'
  | 'Obra o Labor'
  | 'Prestación Servicios'
  | 'Aprendizaje';
export type UnidadDuracion = 'Días' | 'Meses' | 'Años';

export interface SolicitudItem {
  Id: number;
  Pefil_solicitado: SpLookupPerfil;
  Pefil_solicitadoId: number;
  Solicitante: SpPersona;
  SolicitanteId: number;
  AreaSolicitante: SpLookup;
  AreaSolicitanteId: number;
  CentroCosto: SpLookup;
  CentroCostoId: number;
  Created: string;
  FechaRequeridaInicio: string;
  PruebaExcel: NivelExcel;
  MotivoVacante: MotivoVacante;
  JefeInmediato: string;
  RangoSalario: string;
  ElementosNecesarios: string;
  TrabajoAlturasVigente: boolean;
  TipoContrato: TipoContrato;
  DuracionContrato: number;
  UnidadDuracionContrato: UnidadDuracion;
  DefinicionObjetoObra: string;
  Estado_Aprobacion: EstadoAprobacion;
  Aprobado_Lider: boolean;
  Aprobado_DirAdm: boolean;
  Aprobado_Gerente: boolean;
  Fecha_Aprobacion: string | null;
  Observaciones: string;
}

export interface SolicitudCreate {
  Pefil_solicitadoId: number;
  SolicitanteId: number;
  AreaSolicitanteId: number;
  CentroCostoId: number;
  FechaRequeridaInicio: string;
  PruebaExcel: NivelExcel;
  MotivoVacante: MotivoVacante;
  JefeInmediato: string;
  RangoSalario: string;
  ElementosNecesarios: string;
  TrabajoAlturasVigente: boolean;
  TipoContrato: TipoContrato;
  DuracionContrato: number;
  UnidadDuracionContrato: UnidadDuracion;
  DefinicionObjetoObra: string;
}

// ── Candidatos — datos maestros de la persona ─────────────────────────────────
// El CV y demás documentos van como adjuntos nativos del ítem en SP.
// No hay vínculo directo a solicitudes — eso lo maneja Participaciones.

export type TipoIdentificacion = 'CC' | 'CE' | 'PA' | 'NIT' | 'Otro';

export interface CandidatoItem {
  Id: number;
  Nombre_Completo: string;
  TipoIdentificacion: TipoIdentificacion;
  NumeroIdentificacion: string;
  Correo: string;
  Telefono: string;
  Direccion: string;
  Notas_Analista: string;
}

export interface CandidatoCreate {
  Nombre_Completo: string;
  TipoIdentificacion: TipoIdentificacion;
  NumeroIdentificacion: string;
  Correo: string;
  Telefono: string;
  Direccion: string;
  Notas_Analista: string;
}

// ── Participaciones — intersección Candidato ↔ Solicitud ─────────────────────
// Representa a un candidato dentro de un proceso de selección específico.
// Los documentos del proceso (resultados exámenes, etc.) van como adjuntos aquí.

export type EstadoParticipacion =
  | 'En proceso'
  | 'Seleccionado'
  | 'Descartado';

export interface ParticipacionItem {
  Id: number;
  Candidato: SpLookup;           // Title = Nombre_Completo
  CandidatoId: number;
  Solicitud: SpLookup;           // Title = Pefil_solicitado/Cargo
  SolicitudId: number;
  Estado: EstadoParticipacion;
  Fecha_Ingreso: string;
  Examenes_OK: boolean;
  Notas_Proceso: string;         // observaciones específicas de esta participación
}

export interface ParticipacionCreate {
  CandidatoId: number;
  SolicitudId: number;
  Estado: EstadoParticipacion;
  Examenes_OK: boolean;
  Notas_Proceso: string;
}

// ── Ofertas ───────────────────────────────────────────────────────────────────
// ID_Participacion reemplaza a ID_Candidato — la oferta es para una
// participación específica (candidato + solicitud), no para el candidato genérico.

export type EstadoOferta = 'Enviada' | 'Aceptada' | 'Rechazada' | 'Vencida';

export interface OfertaItem {
  Id: number;
  ID_ParticipacionId: number;
  ID_Participacion: SpLookup;
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
  ID_ParticipacionId: number;
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