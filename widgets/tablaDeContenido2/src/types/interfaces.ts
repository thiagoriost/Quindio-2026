import Layer from "@arcgis/core/layers/Layer";

export interface TablaDeContenidoInterface {
    [key: string]: any; // Para manejar cualquier otra propiedad dinámica
    ATRIBUTO?: string;
    DESCARGACAPA?: boolean;
    DESCRIPCIONSERVICIO?: Descripcionservicio;
    ESTADO?: Estado;
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

export enum Estado {
    A = "A",
    I = "I",
}

export interface interfaceCapasNietos {
    capas: interfCapa[];
    tematicasNietas: {
        capasBisnietos: TablaDeContenidoInterface[];
        IDTEMATICAPADRE: number;
        IDTEMATICA: number;
        NOMBRETEMATICA: string;
        TITULOCAPA?: string;

    }[];
}
export interface interfCapa {
    IDCAPA: number;
    IDTEMATICA: number;
    capasNietas: any[];
}

export interface datosBasicosInterface {
    IDTEMATICAPADRE: number;
    IDTEMATICA: number;
    NOMBRETEMATICA: string;
    TITULOCAPA?: string;
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
export interface CapasTematicas {
    ATRIBUTO?: string;
    capasBisnietos?: CapasTematicas[];
    capasHijas?: any[];
    DESCARGACAPA?: boolean;
    DESCRIPCIONSERVICIO?: Descripcionservicio;
    ESTADO?: Estado;
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

export interface InterfaceContextMenu {
    mouseX: number;
    mouseY: number;
    capa_Feature: {
        capa: ItemResponseTablaContenido;
        layer: Layer
    }
}

export interface InterfaceLayer {
    id?: string;
    showLegend?: boolean;
    listMode?: string;
    disablePopup?: boolean;
    title?: string;
    url?: string;
    visibility?: boolean;
    layerType?: string;
    refreshInterval?: number;
    layerDefinition?: LayerDefinition;
    timeAnimation?: boolean;
    showLabels?: boolean;
    screenSizePerspective?: boolean;
    opacity?: number;
}

export interface LayerDefinition {
    minScale: number;
    maxScale: number;
    definitionExpression: null;
    drawingInfo: DrawingInfo;
}

export interface DrawingInfo {
    renderer: Renderer;
}

export interface Renderer {
    type: string;
    field1: string;
    fieldDelimiter: string;
    uniqueValueGroups: UniqueValueGroup[];
    uniqueValueInfos: UniqueValueInfo[];
}

export interface UniqueValueGroup {
    classes: UniqueValueInfo[];
}

export interface UniqueValueInfo {
    description: string;
    label: string;
    symbol: Symbol;
    values?: Array<string[]>;
    value?: string;
}

export interface Symbol {
    type: string;
    color: number[];
    outline?: Symbol;
    style: string;
    width?: number;
}

export interface InterfaceFeaturesLayersDeployed {
    capa:  ItemResponseTablaContenido;
    layer: Layer;
}