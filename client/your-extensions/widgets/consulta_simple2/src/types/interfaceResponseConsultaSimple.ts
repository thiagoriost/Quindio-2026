/** 
** Interface InterfaceResponseConsultaSimple
** @date 2024-06-11
** @author IGAC - DIP
** @dateUpdated 2024-06-20
** @changes Incluir interfaz interfaceMensajeModal
** @changes Incluir tipo dato enum typeMSM  
** @remarks interfaz interfaceMensajeModal obtenido del widget consulta Avanzada
*/
export interface InterfaceResponseConsultaSimple {
    displayFieldName: string;
    fieldAliases:     FieldAliases;
    geometryType:     string;
    spatialReference: SpatialReference;
    fields:           Field[];
    features:         Feature[];
}

export interface Feature {
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
}

export interface Geometry {
    [x: string]: any;
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

export interface InterfaceMensajeModal{
    deployed: boolean;
    type: typeMSM;
    tittle: string;
    body: string;
    subBody?: string;
  }

export enum typeMSM {
    success = "success",
    info    = "info",
    error   = "error",
    warning = "warning",
  }