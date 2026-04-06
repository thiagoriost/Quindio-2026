export const AREAS = [
    {
        idArea: 1,
        area: "Quindio"
    },
    {
        idArea: 2,
        area: "Cuenca del Río La Vieja"
    }
]
export const CATEGORIAS = [
    {
        idCategoria: 1,
        categoria: "Estaciones",
        campoFiltro1: "NOMBRE",
        layerId: 69
    },
    {
        idCategoria: 2,
        categoria: "Puntos de calidad"
    },
    {
        idCategoria: 3,
        categoria: "Tramites ambientales",
        campoFiltro1: "TIPO_TRAMITE",
        campoFiltro2: "IDMUNICIPIO",
        layerId: 10
    },
    {
        idCategoria: 4,
        categoria: "Tramites ambientales predios",
        campoFiltro1: "DESCRIPCIONVALOR",
        campoFiltro2: "IDMUNICIPIO",
        layerId: 8
    },
    {
        idCategoria: 5,
        categoria: "Predios de reforestación"
    },
]
export const SUBCATEGORIAS_ESTACIONES = [
    {
        idSubCategoria: "metereologica",
        subcategoria: "Metereológica",
        campoFiltro1: "NOMBRE",
    },
    {
        idSubCategoria: "limnigrafica" ,
        subcategoria: "Limnigráfica",
        campoFiltro1: "NOMBRE",
    },
]

export const SUBCATEGORIAS_PUNTOSDECALIDAD = [
    {
        idSubCategoria: "calidadagua",
        subcategoria: "Calidad del agua",
        campoFiltro1: "NOMBRE",
    },
    {
        idSubCategoria: "calidadaire" ,
        subcategoria: "Calidad del aire",
    },
]

export const toOptions = (data: any[], labelField: string, valueField: string) =>
    data.map((item: { [x: string]: any }) => ({
        label: item[labelField],
        value: item[valueField]
    }))