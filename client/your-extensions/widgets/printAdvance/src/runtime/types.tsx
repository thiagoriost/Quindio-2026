/**
 * @fileoverview Definiciones de tipos para el widget Advanced Print.
 * Contiene todas las interfaces y tipos necesarios para la funcionalidad de impresión.
 * @module advanced-print/types
 */

/**
 * Formatos de salida soportados por el servicio de impresión.
 * @typedef {"pdf" | "png32" | "jpg"} PrintFormat
 */
export type PrintFormat = "pdf" | "png32" | "jpg";

/**
 * Configuración para ejecutar una impresión.
 * @interface PrintConfiguration
 * @property {string} layout - Nombre de la plantilla de layout a usar (ej: "A4 Portrait")
 * @property {PrintFormat} format - Formato de salida del archivo
 * @property {number} dpi - Resolución en puntos por pulgada (96, 150, 300)
 * @property {string} [title] - Título opcional para el mapa impreso
 * @property {string} [author] - Autor opcional del documento
 */
export interface PrintConfiguration {
  layout: string;
  format: PrintFormat;
  dpi: number;
  title?: string;
  author?: string;
}

/**
 * Resultado de una operación de impresión exitosa.
 * @interface PrintResult
 * @property {string} url - URL del documento generado para descarga
 */
export interface PrintResult {
  url: string;
}

/**
 * Opciones del mapa para la impresión.
 * @interface PrintMapOptions
 * @property {__esri.ExtentProperties} extent - Extensión geográfica del mapa
 * @property {number} scale - Escala del mapa
 */
export interface PrintMapOptions {
  extent: __esri.ExtentProperties;
  scale: number;
}

/**
 * Capa operacional para incluir en la impresión.
 * @interface PrintOperationalLayer
 * @property {string} id - Identificador único de la capa
 * @property {string} url - URL del servicio de la capa
 * @property {number} [opacity] - Opacidad de la capa (0-1)
 * @property {string} [definitionExpression] - Expresión de filtro SQL
 */
export interface PrintOperationalLayer {
  id: string;
  url: string;
  opacity?: number;
  definitionExpression?: string;
}

/**
 * Estructura JSON del WebMap para enviar al servicio de impresión.
 * Sigue la especificación de ArcGIS Print Service.
 * @interface PrintWebMap
 * @property {PrintMapOptions} mapOptions - Opciones de visualización del mapa
 * @property {PrintOperationalLayer[]} operationalLayers - Capas operacionales visibles
 * @property {any} baseMap - Configuración del mapa base en formato JSON de ArcGIS
 */
export interface PrintWebMap {
  mapOptions: PrintMapOptions;
  operationalLayers: PrintOperationalLayer[];
  baseMap: any;
}

/**
 * Parámetros para ejecutar el servicio de impresión.
 * @interface ExecutePrintParams
 * @property {PrintWebMap} webMapJson - JSON del WebMap a imprimir
 * @property {PrintConfiguration} config - Configuración de la impresión
 */
export interface ExecutePrintParams {
  webMapJson: PrintWebMap;
  config: PrintConfiguration;
}

/**
 * Plantilla de layout disponible en el servidor de impresión.
 * @interface LayoutTemplate
 * @property {string} layoutTemplate - Nombre de la plantilla
 * @property {[number, number]} pageSize - Tamaño de página [ancho, alto] en puntos
 * @property {Object} [layoutOptions] - Opciones adicionales de la plantilla
 * @property {Object} [layoutOptions.titleText] - Configuración del título
 * @property {Object} [layoutOptions.authorText] - Configuración del autor
 * @property {Object} [layoutOptions.copyrightText] - Configuración del copyright
 * @property {any[]} [layoutOptions.legendLayers] - Configuración de capas en leyenda
 */
export interface LayoutTemplate {
  layoutTemplate: string;
  pageSize: [number, number];
  layoutOptions?: {
    titleText?: { defaultValue: string };
    authorText?: { defaultValue: string };
    copyrightText?: { defaultValue: string };
    legendLayers?: any[];
  };
}

