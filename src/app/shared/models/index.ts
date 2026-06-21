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
export type NivelExcel = 'No Aplica' | 'Básica' | 'Intermedia' | 'Avanzada';
export type MotivoVacante =
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
  AmpliarPerfilCargo: string;
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
  Proceso_Finalizado: boolean;
  Fecha_Finalizacion: string | null;
}
export interface SolicitudCreate {
  Pefil_solicitadoId: number;
  AreaSolicitanteId: number;
  CentroCostoId: number;
  FechaRequeridaInicio: string;
  PruebaExcel: NivelExcel;
  MotivoVacante: MotivoVacante;
  JefeInmediato: string;
  RangoSalario: string;
  AmpliarPerfilCargo: string;
  ElementosNecesarios: string;
  TrabajoAlturasVigente: boolean;
  TipoContrato: TipoContrato;
  DuracionContrato: number;
  UnidadDuracionContrato: UnidadDuracion;
  DefinicionObjetoObra: string;
  SolicitanteId: number;
}

// ── Candidatos ────────────────────────────────────────────────────────────────
export type TipoIdentificacion = 'CC' | 'CE' | 'PA' | 'NIT' | 'Otro';
export type EstadoCivil = 'Soltero(a)' | 'Casado(a)' | 'Unión libre' | 'Divorciado(a)' | 'Viudo(a)';
export type Escolaridad =
  | 'Primaria'
  | 'Bachillerato'
  | 'Técnico'
  | 'Tecnólogo'
  | 'Profesional'
  | 'Especialización'
  | 'Maestría'
  | 'Doctorado';
export type GrupoSanguineo =
  | 'A+' | 'A-'
  | 'B+' | 'B-'
  | 'AB+' | 'AB-'
  | 'O+' | 'O-';
export type TipoVivienda = 'Propia' | 'Arrendada' | 'Familiar' | 'Otra';

export type EPS =
  | 'Sura'
  | 'Sanitas'
  | 'Nueva EPS'
  | 'Compensar'
  | 'Coomeva'
  | 'Salud Total'
  | 'Famisanar'
  | 'Medimás'
  | 'Coosalud'
  | 'Mutual Ser'
  | 'Otra';

export type FondoPension =
  | 'Colpensiones'
  | 'Porvenir'
  | 'Protección'
  | 'Colfondos'
  | 'Old Mutual'
  | 'Skandia'
  | 'Otra';

export type Banco =
  | 'Bancolombia'
  | 'Banco de Bogotá'
  | 'Davivienda'
  | 'BBVA'
  | 'Banco Popular'
  | 'Banco de Occidente'
  | 'Banco AV Villas'
  | 'Banco Caja Social'
  | 'Nequi'
  | 'Daviplata'
  | 'Scotiabank Colpatria'
  | 'Itaú'
  | 'Otro';

// Datos básicos — se capturan al registrar el candidato
export interface CandidatoItem {
  Id: number;
  Nombre_Completo: string;
  TipoIdentificacion: TipoIdentificacion;
  NumeroIdentificacion: string;
  Correo: string;
  Telefono: string;
  Direccion: string;
  Notas_Analista: string;
  // Datos de vinculación — se completan cuando acepta la oferta
  FechaExpedicionDoc: string | null;
  CiudadExpedicionDoc: string;
  FechaNacimiento: string | null;
  CiudadNacimiento: string;
  EstadoCivil: EstadoCivil | null;
  Escolaridad: Escolaridad | null;
  GrupoSanguineo: GrupoSanguineo | null;
  TipoVivienda: TipoVivienda | null;
  Estrato: number | null;
  Barrio: string;
  EPS: EPS | null;
  Pension: FondoPension | null;
  NumeroCuenta: string;
  Banco: Banco | null;
}

// Datos básicos — para registro inicial
export interface CandidatoCreate {
  Nombre_Completo: string;
  TipoIdentificacion: TipoIdentificacion;
  NumeroIdentificacion: string;
  Correo: string;
  Telefono: string;
  Direccion: string;
  Notas_Analista: string;
}

// Datos de vinculación — complemento tras aceptar oferta
export interface CandidatoVinculacionUpdate {
  FechaExpedicionDoc: string;
  CiudadExpedicionDoc: string;
  FechaNacimiento: string;
  CiudadNacimiento: string;
  EstadoCivil: EstadoCivil;
  Escolaridad: Escolaridad;
  GrupoSanguineo: GrupoSanguineo;
  TipoVivienda: TipoVivienda;
  Estrato: number;
  Barrio: string;
  EPS: EPS;
  Pension: FondoPension;
  NumeroCuenta: string;
  Banco: Banco;
}

// ── Participaciones ───────────────────────────────────────────────────────────
export type EstadoParticipacion = 'En proceso' | 'Seleccionado' | 'Descartado';
export interface ParticipacionItem {
  Id: number;
  Candidato: SpLookup;
  CandidatoId: number;
  Solicitud: SpLookup;
  SolicitudId: number;
  Estado: EstadoParticipacion;
  Fecha_Ingreso: string;
  Examenes_OK: boolean;
  Notas_Proceso: string;
}
export interface ParticipacionCreate {
  CandidatoId: number;
  SolicitudId: number;
  Estado: EstadoParticipacion;
  Examenes_OK: boolean;
  Notas_Proceso: string;
}

// ── PlantillasDocumento ───────────────────────────────────────────────────────
// Lista SP que define qué documentos se generan y firman en el proceso
export interface PlantillaDocumentoItem {
  Id: number;
  Title: string;           // nombre del documento, ej: "Contrato término fijo"
  NombreArchivo: string;   // nombre de la plantilla, ej: "contrato_termino_fijo_template.docx"
  Activo: boolean;
  Orden: number;           // orden en que se muestran / firman
}

// ── Ofertas ───────────────────────────────────────────────────────────────────
export type EstadoOferta = 'Enviada' | 'Aceptada' | 'Rechazada' | 'Vencida';
export interface OfertaItem {
  Id: number;
  ID_ParticipacionId: number;
  ID_Participacion: SpLookup;
  Salario_Ofertado: number;
  Cargo: string;
  PDF_Oferta_URL: { Url: string; Description: string } | null;
  Estado_Oferta: EstadoOferta;
  AplicaKPI: boolean;
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
  AplicaKPI: boolean;
  Aprobada_DirAdm: boolean;
}

// ── KPI Ofertas ───────────────────────────────────────────────────────────────
export type UnidadPeriodoKPI = 'Mes' | 'Trimestre' | 'Semestre';
export interface KpiOfertaItem {
  Id: number;
  ID_OfertaId: number;
  ID_Oferta: SpLookup;
  Periodo: number;
  UnidadPeriodo: UnidadPeriodoKPI;
  PorcentajeGarantizado: number;
  ValorKPI: number;
}
export interface KpiOfertaCreate {
  ID_OfertaId: number;
  Periodo: number;
  UnidadPeriodo: UnidadPeriodoKPI;
  PorcentajeGarantizado: number;
  ValorKPI: number;
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


export type EstadoContratacion =
  | 'Iniciado'
  | 'Generando_Documentos'
  | 'Enviado_Firma'
  | 'Firmado_Aspirante'
  | 'Completado'
  | 'Error';

export interface ContratacionItem {
  Id: number;
  ID_OfertaId: number;
  ID_Oferta: SpLookup;
  DocumentosAdicionales: string[];   // Choice múltiple → array de Title de PlantillasDocumento
  Estado_Contratacion: EstadoContratacion;
  AdobeSign_AgreementID: string;
  Fecha_Inicio: string;
  Fecha_Envio_Firma: string | null;
  Fecha_Firma_Aspirante: string | null;
  Fecha_Firma_RepLegal: string | null;
  IP_Firma_Aspirante: string;
  IP_Firma_RepLegal: string;
  PDF_Contrato_Combinado_URL: { Url: string; Description: string } | null;
  Certificado_Auditoria_URL: { Url: string; Description: string } | null;
  Notas: string;
}

export interface ContratacionCreate {
  ID_OfertaId: number;
  DocumentosAdicionales: string[];
  Estado_Contratacion: EstadoContratacion;
  Fecha_Inicio: string;
  Notas: string;
}