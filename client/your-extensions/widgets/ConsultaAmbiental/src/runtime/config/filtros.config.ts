/**
 * Jerarquía de cascada de filtros
 * Esto permitira limpiar filtros automáticamente cuando cambian los padres. IMPLEMENTAR
 *
 */
export const CASCADE_ORDER = [
  "area",
  "tematica",
  "categoria",
  "subcategoria",
  "nombre"
]

export const DEFINICION_FILTROS = [
  {
    campo: "area",
    label: "Área temática",
    tipo: "select",
    opciones: "areas",
    onChange: "onChangeAreaTematica",
    root: true
  },
  {
    campo: "categoria",
    label: "Categoría",
    tipo: "select",
    opciones: "categorias",
    dependeDe: "area",
    onChange: "cargarSubcategorias",
    casosEspeciales: {
      "estaciones": "subcategoriasEstaciones",
      "puntos de calidad": "subcategoriasPuntosCalidad",
    }
  },
  {
    campo: "subcategoria",
    label: "SubCategoría",
    tipo: "select",
    opciones: "subcategorias",
    dependeDe: "categoria",
    onChange: "onChangeSubcategoria",
    condicion: (filters: { categoria: number }) => filters.categoria !== 5, // categoria != 5 -> predios de reforestación
  },

  /*
    Nombre:
    - depende de subcategoria
    - pero solo aplica si categoria = estaciones ó Puntos de calidad
*/
  {
    campo: "nombre",
    label: "Nombre",
    tipo: "select",
    opciones: "nombres",
    dependeDe: "subcategoria",
    onChange: "onChangeEstacion",
    condicion: (filters: { categoria: number }) => filters.categoria === 1 || filters.categoria === 2, // 1=Estaciones ó 2=Puntos de calidad
  },
  {
    campo: "anio",
    label: "Año",
    tipo: "select",
    opciones: "anios",
  },
  {
//    campo: "municipio", // 20260321
    campo: "idMunicipio",
    label: "Municipio",
    tipo: "select",
    opciones: "municipios",
    dependeDe: 'subcategoria',
    dependeDeCondicional: (filters: { categoria: number }) =>
      filters.categoria === 5 ? "categoria" : "subcategoria" // 5='Predios de reforestación'
  },
  {
    campo: "fechaInicio",
    label: "Fecha inicio",
    tipo: "date",
    dependeDe: 'municipio',
    condicion: (filters: { categoria: number }) => filters.categoria === 2, // 2=Puntos de calidad
  },
  {
    campo: "fechaFin",
    label: "Fecha fin",
    tipo: "date",
    dependeDe: 'municipio',
    condicion: (filters: { categoria: number }) => filters.categoria === 2, // 2=Puntos de calidad
  }
]