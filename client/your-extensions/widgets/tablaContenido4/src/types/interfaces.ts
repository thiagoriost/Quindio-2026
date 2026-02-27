/**
 * @fileoverview Interfaces y tipos para el widget de Tabla de Contenido.
 * Define las estructuras de datos para la tabla de contenido, árbol,
 * context menu y capas desplegadas.
 *
 * @module tablaContenido4/types/interfaces
 */

import type Layer from "@arcgis/core/layers/Layer"

/**
 * Interfaz base para los datos de la tabla de contenido del servicio.
 * Representa un registro plano que puede ser una temática (sin URL) o una capa (con URL).
 *
 * @interface TablaDeContenidoInterface
 */
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

/**
 * Enum con las descripciones de servicios disponibles.
 * @enum {string}
 */
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

/**
 * Enum para el estado de los elementos (Activo/Inactivo).
 * @enum {string}
 */
export enum Estado {
    A = "A",
    I = "I",
}

/**
 * Interfaz para capas nietas con sus temáticas.
 * @interface interfaceCapasNietos
 * @deprecated Usar TreeNode con children en su lugar
 */
export interface interfaceCapasNietos {
    capas: interfCapa[];
    tematicasNietas: Array<{
        capasBisnietos: TablaDeContenidoInterface[];
        IDTEMATICAPADRE: number;
        IDTEMATICA: number;
        NOMBRETEMATICA: string;
        TITULOCAPA?: string;

    }>;
}

/**
 * Interfaz básica para una capa.
 * @interface interfCapa
 */
export interface interfCapa {
    IDCAPA: number;
    IDTEMATICA: number;
    capasNietas: any[];
}

/**
 * Interfaz con datos básicos de una temática.
 * @interface datosBasicosInterface
 */
export interface datosBasicosInterface {
    IDTEMATICAPADRE: number;
    IDTEMATICA: number;
    NOMBRETEMATICA: string;
    TITULOCAPA?: string;
}

/**
 * Interfaz normalizada para los datos de la tabla de contenido.
 * Usada internamente después de normalizar los datos del servicio.
 *
 * @interface ItemResponseTablaContenido
 */
export interface ItemResponseTablaContenido {
    ATRIBUTO: string;
    DESCRIPCIONSERVICIO: Descripcionservicio | string;
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
    ESTADO?: string;
    capasHijas?: Tematicas[];
    capasNietas?: ItemResponseTablaContenido[]
}

/**
 * Interfaz para temáticas con sus capas hijas.
 * @interface Tematicas
 * @deprecated Usar TreeNode con children
 */
export interface Tematicas {
    IDTEMATICAPADRE: number;
    IDTEMATICA: number;
    NOMBRETEMATICA: string;
    TITULOCAPA: string;
    capasHijas?: Tematicas[];
    capasNietas?: CapasTematicas[];
}

/**
 * Interfaz para capas dentro de temáticas.
 * @interface CapasTematicas
 * @deprecated Usar TreeNode con children
 */
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
    values?: string[][];
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
    capa: ItemResponseTablaContenido;
    layer: Layer;
}

/**
 * Interfaz para nodos del árbol jerárquico
 * Los nodos con URL no vacío son capas que pueden ser checkeadas
 */
export interface TreeNode extends ItemResponseTablaContenido {
    children?: TreeNode[];
}