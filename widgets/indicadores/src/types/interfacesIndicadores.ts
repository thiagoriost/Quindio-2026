export interface InterfaceFeatureSelected {
    aggregateGeometries: null;
    geometry:            Geometry;
    symbol:              null;
    attributes:          Attributes;
    popupTemplate:       null;
}

export interface Attributes {
    OBJECTID:   number;
    OBJECTID_1: number;
    DEPARTAMEN: string;
    MUNICIPIO:  string;
    PCC:        string;
    VEREDA:     string;
}

export interface Geometry {
    spatialReference: SpatialReference;
    rings:            Array<Array<number[]>>;
}

export interface SpatialReference {
    latestWkid: number;
    wkid:       number;
}
