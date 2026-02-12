import Layer from "@arcgis/core/layers/Layer";

export interface InterfaceResponseConsulta {
    displayFieldName: string;
    features:         interfaceFeature[];
    fieldAliases:     FieldAliases;
    fields:           Field[];
    geometryType:     string;
    spatialReference: SpatialReference;
    error: InterfaceError;
}

export interface InterfaceError {
    code:    number;
    message: string;
    details: any[];
    row
}

export interface interfaceFeature {
    attributes: Attributes;
    geometry:   Geometry;
}

export interface Attributes {
    OBJECTID_1:   number;
    OBJECTID:     number;
    MUNICIPIO:    Municipio;
    DEPARTAMEN:   Departamen;
    PCC:          Pcc;
    VEREDA:       string;
    COOR_X:       number;
    COOR_Y:       number;
    AREA_HA:      number;
    "SHAPE.AREA": number;
    "SHAPE.LEN":  number;
}

export enum Departamen {
    Caldas = "caldas",
}

export enum Municipio {
    Riosucio = "Riosucio",
}

export enum Pcc {
    A = "A",
    P = "P",
    I = "I",
}

export interface Geometry {
    rings: Array<Array<number[]>>;
}

export interface FieldAliases {
    OBJECTID_1:   string;
    OBJECTID:     string;
    MUNICIPIO:    string;
    DEPARTAMEN:   string;
    PCC:          string;
    VEREDA:       string;
    COOR_X:       string;
    COOR_Y:       string;
    AREA_HA:      string;
    "SHAPE.AREA": string;
    "SHAPE.LEN":  string;
}

export interface Field {
    name:    string;
    type:    string;
    alias:   string;
    length?: number;
}

export interface SpatialReference {
    wkid:       number;
    latestWkid: number;
}

export interface InterfaceFeaturesLayersDeployed {
    capa:  ItemResponseTablaContenido;
    layer: Layer;
}
export interface ItemResponseTablaContenido {
    ATRIBUTO: string;
    DESCRIPCIONSERVICIO: Descripcionservicio;
    IDCAPA: number;
    IDTEMATICA: number;
    IDTEMATICAPADRE: number;
    METADATOCAPA: string;
    METADATOSERVICIO: string;
    NOMBRECAPA: string;
    NOMBRETEMATICA: string;
    TITULOCAPA: string;
    URL: string;
    URLSERVICIOWFS: string;
    VISIBLE: boolean;
    capasHijas?: Tematicas[];
    capasNietas?: ItemResponseTablaContenido[]
}
export interface Tematicas {
    IDTEMATICAPADRE: number;
    IDTEMATICA: number;
    NOMBRETEMATICA: string;
    TITULOCAPA: string;
    capasHijas?: Tematicas[];
    capasNietas?: CapasTematicas[];
}

export enum Descripcionservicio {
    Ambiental = "Ambiental",
    CartografíaBásica = "Cartografía Básica",
    CartografíaBásica15000 = "Cartografía Básica 1:5.000",
    CuencaLaVieja = "Cuenca La Vieja",
    CulturaYTurismo = "Cultura y Turismo",
    Educación = "Educación",
    Empty = "",
    GestiónDelRiesgo = "Gestión del riesgo",
    IndustriaYComercio = "Industria y comercio",
    MovimientosEnMasaPúblico = "Movimientos en masa público",
    OrdenamientoTerritorial = "Ordenamiento territorial",
    Salud = "Salud",
    Sgc = "SGC",
    SusceptibilidadIncendios = "Susceptibilidad Incendios",
    'Ambiental Ajustado' = "Ambiental Ajustado"
}
export interface CapasTematicas {
    ATRIBUTO?: string;
    capasBisnietos?: CapasTematicas[];
    capasHijas?: any[];
    DESCARGACAPA?: boolean;
    DESCRIPCIONSERVICIO?: Descripcionservicio;
    ESTADO?: Pcc;
    IDCAPA?: number;
    IDTEMATICA?: number;
    IDTEMATICAPADRE?: number;
    METADATOCAPA?: string;
    METADATOSERVICIO?: string;
    NOMBRECAPA?: string;
    NOMBRETEMATICA?: string;
    TITULOCAPA?: string;
    URL?: string;
    URLSERVICIOWFS?: string;
    VISIBLE?: boolean;
}

export interface Row {
    id: number;
    name: string;
  }

export interface InterfaceRow {
    row:    RowCell;
    column: Column;
}

export interface Column {
    key:       string;
    name:      string;
    idx:       number;
    level:     number;
    frozen:    boolean;
    width:     string;
    minWidth:  number;
    sortable:  boolean;
    resizable: boolean;
    draggable: boolean;
}

export interface RowCell {
    OBJECTID_1:   number;
    OBJECTID:     number;
    MUNICIPIO:    string;
    DEPARTAMEN:   string;
    PCC:          string;
    VEREDA:       string;
    COOR_X:       number;
    COOR_Y:       number;
    AREA_HA:      number;
    "SHAPE.AREA": number;
    "SHAPE.LEN":  number;
    geometry:     Geometry;
}

export interface Geometry {
    rings: Array<Array<number[]>>;
}

  