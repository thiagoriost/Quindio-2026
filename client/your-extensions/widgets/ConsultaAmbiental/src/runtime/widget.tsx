/** @jsx jsx */

import { React, jsx , appActions, getAppStore } from 'jimu-core'
import { useCascadingFilters } from './hooks/useCascadingFilters'
import { FiltrosClasificacion } from './components/FiltrosClasificacion'
import { SearchActionBar } from '../../../shared/components/search-action-bar'
import { ArcgisService } from '../../../shared/services/arcgis.service'
import { alertService } from '../../../shared/services/alert.service'
import type { ApiResponse } from 'widgets/shared/models/api-response.model'
import { useCancelableHttp } from '../../../shared/hooks/useCancelableHttp'

import { WIDGET_IDS } from '../../../shared/constants/widget-ids'


import {
    AREAS,
    CATEGORIAS,
    SUBCATEGORIAS_ESTACIONES,
    SUBCATEGORIAS_PUNTOSDECALIDAD,
    toOptions
} from './config/consulta-ambiental.config'
import { urls } from '../../../api/serviciosQuindio'


const Widget = (props: any) => {

    const widgetResultId = WIDGET_IDS.RESULT
    const widgetChartId = WIDGET_IDS.CHART

    const outputDs = props.outputDataSources?.[0] // 20260317

    const {
        filters,
        setFilter,
        clearFilters
    } = useCascadingFilters()

    //    console.log("GLOBAL FILTERS:", filters)

    const [loading, setLoading] = React.useState(false)

    const [opciones, setOpciones] = React.useState({

        areas: toOptions(AREAS, "area", "idArea"),
        categorias: toOptions(CATEGORIAS, "categoria", "idCategoria"),
        subcategorias: [],
        nombres: [],

        //        anios: generarAnios(),
        municipios: [],

    })

    const arcgisService = new ArcgisService()

    /**
      * Estructura esperada de respuesta simplificada del servicio ArcGIS.
      */
    interface ArcGisQueryResponse {
        /** Lista de features retornadas por la consulta */
        features: any[];

        /** Sistema de referencia espacial del resultado */
        spatialReference?: __esri.SpatialReference;

        /** Tipo de geometría devuelta */
        geometryType?: string

        /** Campos del layer */
        fields?: any[]
    }

    const { execute } = useCancelableHttp()

    const catalogosEspeciales = {
        subcategoriasEstaciones: SUBCATEGORIAS_ESTACIONES,
        subcategoriasPuntosCalidad: SUBCATEGORIAS_PUNTOSDECALIDAD
    }

    React.useEffect(() => {
        console.log("iniciando useEffecy DS:", outputDs)

        if (!outputDs) return

        console.log("DS listo:", outputDs)

        outputDs.setSchema({
            idField: 'id',
            fields: [
                { name: 'id', type: 'esriFieldTypeOID' },
                { name: 'categoria', type: 'esriFieldTypeString' },
                { name: 'valor', type: 'esriFieldTypeDouble' }
            ]
        })

    }, [outputDs])

    const handlers = {

        onChangeAreaTematica:  () => {
            handlers.cargarMunicipios_All()
        },
        onChangeSubcategoria:  (subcategoria, configFiltro, filtros) => {
            console.log("onChangeSubcategoria:filtros ", filtros)
            const categoriaId = filtros.categoria

            const categoria = CATEGORIAS.find(c => c.idCategoria === categoriaId)

            if (!categoria) return

            const categoriaNombre = categoria.categoria.toLowerCase()

            // CASO ESTACIONES
            if (categoriaNombre === "estaciones") {
                handlers.cargarNombresEstaciones(subcategoria)
                return
            }
            // CASO PUNTOS DE CALIDAD
            if (categoriaNombre === "puntos de calidad") {
                handlers.cargarNombresPuntosDeCalidad(subcategoria)
                return
            }

            // OTROS CASOS
            //            handlers.cargarMunicipios()

            const where = "1=1"
            const urlBase = urls.CARTOGRAFIA.BASE
            const layerId = urls.CARTOGRAFIA.MUNICIPIOS
            const outFields = "NOMBRE,IDMUNICIPIO"

            handlers.cargarMunicipios(
                where,
                urlBase,
                layerId,
                outFields
            )
        },
        /*
                onChangeNombre_ant: async (nombre, configFiltro, filtros) => {
                    console.log("onChangeNombre filtros >>> ", filtros)
                    console.log("onChangeNombre nombre >>> ", nombre)

                    const idSubcategoria = filtros.subcategoria
                    let urlBase = null
                    let layerId = null
                    let where = null
                    let outFields = null

                    if (idSubcategoria === "metereologica") { // Metereológica 69
                        urlBase = urls.Ambiental_T2025.BASE
                        layerId = urls.Ambiental_T2025.Estaciones_climaticas
                        where = 'NOMBRE=' + nombre
                        outFields = 'MUNICIPIO, IDMUNICIPIO'

                    }
                    if (idSubcategoria === "limnigrafica") { // Limnigráfica 68
                        urlBase = urls.Ambiental_T_Ajustado.BASE
                        layerId = urls.Ambiental_T_Ajustado.Estaciones_limnigraficas
                        where = 'NOMBRE=' + nombre
                        outFields = 'MUNICIPIO, IDMUNICIPIO'
                    }
                    if (idSubcategoria === "calidadagua") { // Calidad del agua 0
                        urlBase = urls.AmbientalAlfanumerico.BASE
                        layerId = urls.AmbientalAlfanumerico.V_CALAAGUAAFLUMUN
                        where = `'NOMBREESTACION' = '${nombre}'`
                        outFields = `'NOMBRE ,IDMUNICIPIO'`

                    }
                    if (idSubcategoria === "calidadaire") { // Calidad del aire 4
                        urlBase = urls.AmbientalAlfanumerico.BASE
                        layerId = urls.AmbientalAlfanumerico.V_CALAIREESTMUN
                        where = 'NOMBREESTACION=' + nombre
                        outFields = 'NOMBRE ,IDMUNICIPIO'
                    }

                    handlers.cargarMunicipiosSegunNombre(where, urlBase, layerId, outFields)

                },
        */
        onChangeNombre:  (nombre, configFiltro, filtros) => { // 20260321 se usa ahore onChangeEstacion

            console.log("onChangeNombre >>>", { nombre, filtros })

            const selected = opciones.nombres.find(n => n.value === nombre)

            const idMunicipio = selected?.idMunicipio
            console.log("seleccionado >>>", { nombre, idMunicipio })


            const idSubcategoria = filtros.subcategoria

            // Validación básica
            if (!idSubcategoria || !nombre) {
                console.warn("Faltan datos:", { idSubcategoria, nombre })
                return
            }

            let urlBase = null
            let layerId = null
            let campoNombre = null
            let outFields = null

            switch (idSubcategoria) {

                case "metereologica": // 69
                    urlBase = urls.Ambiental_T2025.BASE
                    layerId = urls.Ambiental_T2025.Estaciones_climaticas
                    campoNombre = "NOMBRE"
                    outFields = "MUNICIPIO, IDMUNICIPIO"
                    break

                case "limnigrafica": // 68
                    urlBase = urls.Ambiental_T_Ajustado.BASE
                    layerId = urls.Ambiental_T_Ajustado.Estaciones_limnigraficas
                    campoNombre = "NOMBRE"
                    outFields = "MUNICIPIO, IDMUNICIPIO"
                    break

                case "calidadagua": // 0
                    urlBase = urls.AmbientalAlfanumerico.BASE
                    layerId = urls.AmbientalAlfanumerico.V_CALAAGUAAFLUMUN
                    campoNombre = "NOMBREESTACION"
                    //campoNombre_new = "NOMBRE" // nombre de la estacion
                    //const subCategoria = SUBCATEGORIAS_PUNTOSDECALIDAD.find(sc => sc.idSubCategoria === idSubcategoria )
                    //const campoNombre = subCategoria?.campoFiltro1

                    outFields = "NOMBRE, IDMUNICIPIO"
                    //outFields = "IDMUNICIPIO, IDMUNICIPIO"
                    break

                case "calidadaire": // 4
                    urlBase = urls.AmbientalAlfanumerico.BASE
                    layerId = urls.AmbientalAlfanumerico.V_CALAIREESTMUN
                    campoNombre = "NOMBREESTACION"
                    outFields = "NOMBRE, IDMUNICIPIO"
                    break

                default:
                    console.warn("Subcategoría no soportada:", idSubcategoria)
                    return
            }

            // Para evitar errores SQL
            const safeNombre = String(nombre).replace(/'/g, "''").trim()

            // WHERE SIN comillas en el campo
            const where = `${campoNombre} = '${safeNombre}'`

            console.log("WHERE >>>", where)

            handlers.cargarMunicipios(
                where,
                urlBase,
                layerId,
                outFields
            )


            //handlers.filtrarMunicipios()
        },

        onChangeEstacion: (nombreSeleccionado, filtro, filtros, setFiltro) => {

            const estacion = opciones.nombres.find(
                n => n.value === nombreSeleccionado
            )

            if (!estacion) return

            const idMunicipio = estacion.idMunicipio

            console.log("onChangeEstacion >>>", { nombreSeleccionado, filtros, setFiltro, idMunicipio })
            console.log("idMunicipio:", idMunicipio)
            console.log("municipios:", opciones.municipios)

            setFiltro("idMunicipio", String(idMunicipio))

        },

        cargarSubcategorias: async (categoriaId, configFiltro) => {
            console.log('cargarSubcategorias >>> ', categoriaId)
            console.log('configFiltro >>> ', configFiltro)

            const categoria = CATEGORIAS.find(c => c.idCategoria === categoriaId)
            const categoriaNombre = categoria?.categoria?.toLowerCase()

            console.log("categoriaNombre >>> ", categoriaNombre)

            // revisar si hay caso especial
            const casoEspecialNombre = configFiltro.casosEspeciales?.[categoriaNombre]
            const casoEspecial = configFiltro.casosEspeciales
            console.log("casoEspecial >>> ", casoEspecial)
            console.log("casoEspecialNombre >>> ", casoEspecialNombre)


            if (casoEspecialNombre) {

                const datos = catalogosEspeciales[casoEspecialNombre]

                setOpciones(prev => ({
                    ...prev,
                    subcategorias: toOptions(datos, "subcategoria", "idSubCategoria")
                }))

                return
            }

            let layerId = -1
            let outField = ""

            switch (categoriaId) {
                case 3: { // Tramites ambientales"
                    layerId = urls.AmbientalAlfanumerico.TRAMITESAMBPUNTO // TIPO_TRAMITE
                    break
                }
                case 4: { // Tramites ambientales predios
                    layerId = urls.AmbientalAlfanumerico.TRAMITESCATASTRO // DESCRIPCIONVALOR
                    break
                }
                case 5: { // predios forestales, no tiene subcategorias.
/*
                    const where = "1=1"
                    const urlBase = urls.CARTOGRAFIA.BASE
                    const layerId = urls.CARTOGRAFIA.MUNICIPIOS
                    const outFields = "NOMBRE,IDMUNICIPIO"

                    handlers.cargarMunicipios(
                        where,
                        urlBase,
                        layerId,
                        outFields
                    )
*/
                    break
                }

                default: {
                    break
                }
            }

            outField = categoria?.campoFiltro1

            const urlBase = urls.AmbientalAlfanumerico.BASE
            const response = await handlers.consultarMapServer(urlBase, layerId, outField)
            console.log('cargarSubcategorias:response >>>', response)

            // Si hubo error HTTP o servidor → ya se mostró alerta
            if (!response.success) return

            const features = response.data?.features || []

            const subcategorias = [...new Set(
                features
                    .map(f => f.attributes?.[outField])
                    .filter(Boolean)
            )]
                .map((tipo, idx) => ({
                    label: tipo,
                    value: tipo
                    //  value: idx + 1
                }))

            setOpciones(prev => ({
                ...prev,
                subcategorias
            }))

        },

        cargarNombresEstaciones: async (idSubcategoria) => {
            console.log("cargar nombres para subcategoria >>> ", idSubcategoria)

            setLoading(true)

            let urlBase = null
            let layerId = null
            const outField = "NOMBRE"

            if (idSubcategoria === "metereologica") { // Metereológica
                urlBase = urls.Ambiental_T2025.BASE
                layerId = urls.Ambiental_T2025.Estaciones_climaticas

            }
            if (idSubcategoria === "limnigrafica") { // Limnigráfica
                urlBase = urls.Ambiental_T_Ajustado.BASE
                layerId = urls.Ambiental_T_Ajustado.Estaciones_limnigraficas

            }

            // llamar servicio

            const response = await handlers.consultarMapServer(urlBase, layerId, outField)

            const features = response.data?.features || []

            const nombres = [...new Set(
                features
                    .map(f => f.attributes?.[outField])
                    .filter(Boolean)
            )]
                .map((tipo, idx) => ({
                    label: tipo,
                    value: tipo
                    //  value: idx + 1
                }))

            console.log("nombres >>> ", nombres)

            setOpciones(prev => ({
                ...prev,
                nombres
            }))

            setLoading(false)
            //            handlers.cargarMunicipios(urlBase, layerId, outFieldsMunipios)
        },
        cargarNombresPuntosDeCalidad_ant: async (idSubcategoria) => {
            console.log('cargarNombresPuntosDeCalidad:', idSubcategoria)

            setLoading(true)

            const urlBase = urls.AmbientalAlfanumerico.BASE
            let layerId = null
            //   const outField = "NOMBREESTACION";
            const outField = "NOMBRE"
            if (idSubcategoria === "calidadagua") { // Calidad del agua
                layerId = urls.AmbientalAlfanumerico.V_CALAAGUAAFLUMUN
            }
            if (idSubcategoria === "calidadaire") { // Calidad del aire
                layerId = urls.AmbientalAlfanumerico.V_CALAIREESTMUN
            }

            // llamar servicio
            const response = await handlers.consultarMapServer(urlBase, layerId, outField)

            const features = response.data?.features || []

            const nombres = [...new Set(
                features
                    .map(f => f.attributes?.[outField])
                    .filter(Boolean)
            )]
                .map((tipo, idx) => ({
                    label: tipo,
                    value: tipo
                }))

            console.log("nombres >>> ", nombres)

            setOpciones(prev => ({
                ...prev,
                nombres
            }))

            setLoading(false)
            //            handlers.cargarMunicipios_All()

        },
        cargarNombresPuntosDeCalidad: async (idSubcategoria) => {
            console.log('cargarNombresPuntosDeCalidad:', idSubcategoria)

            setLoading(true)

            const urlBase = urls.AmbientalAlfanumerico.BASE
            let layerId = null
            //   const outField = "NOMBREESTACION";
            //const outField = "NOMBRE";
            const outField = "NOMBRE, IDMUNICIPIO"
            if (idSubcategoria === "calidadagua") { // Calidad del agua
                layerId = urls.AmbientalAlfanumerico.V_CALAAGUAAFLUMUN
            }
            if (idSubcategoria === "calidadaire") { // Calidad del aire
                layerId = urls.AmbientalAlfanumerico.V_CALAIREESTMUN
            }

            // llamar servicio
            const response = await handlers.consultarMapServer(urlBase, layerId, outField)

            const features = response.data?.features || []

            const nombres = features
                .map(f => ({
                    nombre: f.attributes?.NOMBRE,
                    idMunicipio: f.attributes?.IDMUNICIPIO
                }))
                .filter(item => item.nombre && item.idMunicipio)

            // regla no deben existir el mismo nombre de estacion en mes de un municipios
            // nombre unico, idmunicipio unico

            const nombresUnicos = Array.from(
                new Map(
                    nombres.map(item => [item.nombre, item]) // clave: nombre
                ).values()
            )
            const opcionesNombres = nombresUnicos.map(item => ({
                label: item.nombre,
                value: item.nombre,
                idMunicipio: item.idMunicipio
            }))

            console.log("nombres >>> ", opcionesNombres)

            setOpciones(prev => ({
                ...prev,
                nombres: opcionesNombres
            }))

            setLoading(false)
            //            handlers.cargarMunicipios_All()

        },
        cargarMunicipios_All: async () => {
            console.log('Cargando municipios...')

            setLoading(true)

            const response = await execute((signal) =>
                arcgisService.queryLayer<any>(
                    urls.CARTOGRAFIA.BASE,
                    urls.CARTOGRAFIA.MUNICIPIOS,
                    {
                        outFields: 'IDMUNICIPIO, NOMBRE',
                        returnGeometry: false
                    },
                    true,
                    signal
                )
            )

            if (!response.success) {
                setLoading(false)
                return
            }

            const features = response.data.features

            const municipios = features
                .map((f: any) => ({
                    value: String(f.attributes.IDMUNICIPIO),
                    label: f.attributes.NOMBRE
                }))
                .sort((a: any, b: any) => a.label.localeCompare(b.label))

            setOpciones(prev => ({
                ...prev,
                municipios
            }))

            setLoading(false)
        },
        cargarMunicipios: async (where?: string, urlBase?: string, layerId?: number, outFields?: string) => {
            console.log("cargarMunicipiosSegunNombres:")

            setLoading(true)

            const response = await execute((signal) =>
                arcgisService.queryLayer<any>(
                    urlBase,
                    layerId,
                    {
                        where,
                        outFields,
                        extraParams: 'returnDistinctValues=true&orderByFields=' + outFields,
                        returnGeometry: false
                    },
                    true,
                    signal
                )
            )

            if (!response.success) {
                setLoading(false)
                return
            }

            const features = response.data.features

            const municipios = features
                .map((f: any) => ({
                    value: String(f.attributes.IDMUNICIPIO),
                    label: f.attributes.NOMBRE || f.attributes.MUNICIPIO
                }))

            setOpciones(prev => ({
                ...prev,
                municipios
            }))

            setLoading(false)
        },
        filtrarMunicipios:  () => {
            console.log('Filtrar Municipios...')
        },


        consultarMapServer: async (
            urlBase: string,
            layerId: number,
            outField: string,
        ): Promise<ApiResponse<ArcGisQueryResponse>> => {
            return await execute((signal) =>
                arcgisService.queryLayer<ArcGisQueryResponse>(
                    urlBase,
                    layerId,
                    {
                        outFields: outField,
                        extraParams: 'returnDistinctValues=true&orderByFields=' + outField,
                        returnGeometry: false
                    },
                    true,
                    signal
                )
            )
        }
    }


    const consultarEstaciones = async (filters: any) => {
        const { subcategoria, nombre, municipio } = filters

        // 1. Definimos variables con un valor inicial o manejamos el caso por defecto
        let urlBaser: string = ""
        let layerId: number = 0

        try {
            //
            if (subcategoria === "metereologica") {
                urlBaser = urls.Ambiental_T2025.BASE
                layerId = urls.Ambiental_T2025.Estaciones_climaticas
            } else if (subcategoria === "limnigrafica") {
                urlBaser = urls.Ambiental_T_Ajustado.BASE
                layerId = urls.Ambiental_T_Ajustado.Estaciones_limnigraficas
            } else {
                // Caso de seguridad por si llega una subcategoría no mapeada
                console.warn("Subcategoría no reconocida")
                return
            }

            const where = `IDMUNICIPIO = '${municipio}' AND NOMBRE = '${nombre.toUpperCase()}'`

            console.log("consultarEstaciones:where >>> ", where)

            const response = await realizarConsulta(urlBaser, layerId, where)

            // Validación de respuesta
            if (!response || !response.success || !response.data) return

            const resultado = response.data

            // Verificación de registros encontrados
            if (!resultado.features || resultado.features.length === 0) {
                alertService.warning(
                    'Sin resultados',
                    'No se encontraron resultados para los criterios seleccionados'
                )
                return
            }

            // Extracción limpia de datos
            const features = resultado.features
            const spatialReference = resultado.spatialReference
            const fields = resultado.fields?.map((f: any) => ({
                name: f.name,
                alias: f.alias
            })) || []

            abrirTablaResultados(features, fields, spatialReference)

        } catch (error) {
            console.error("Error consultando estaciones:", error)
        }
    }

    const consultarPuntosDeCalidad = async (filters: any) => {
//        const { subcategoria, nombre, municipio, fechaInicio, fechaFin } = filters;
        const { subcategoria, nombre, idMunicipio } = filters

        const urlBase = urls.AmbientalAlfanumerico.BASE
        let layerId: number = 0
        try {
            //
            if (subcategoria === "calidadagua") {
                layerId = urls.AmbientalAlfanumerico.V_CALAAGUAAFLUMUN
            } else if (subcategoria === "calidadaire") {
                layerId = urls.AmbientalAlfanumerico.V_CALAIREESTMUN
            } else {
                console.warn("Subcategoría no reconocida")
                return
            }

            const where = `IDMUNICIPIO = '${idMunicipio}' AND NOMBRE = '${nombre.toUpperCase()}'`
/*
            let where = `IDMUNICIPIO = '${idMunicipio}' AND NOMBREESTACION = '${nombre.toUpperCase()}'`;

            if (fechaInicio && fechaFin) {
                const fi = formatDateOnly(fechaInicio, -1) // -1 día, para evitar errores de limite timestamp
                const ff = formatDateOnly(fechaFin, +1)    // +1 día

                where += ` AND FECHA BETWEEN DATE '${fi}' AND DATE '${ff}'`
            } else if (fechaInicio) {
                const fi = formatDateOnly(fechaInicio, -1)
                where += ` AND FECHA >= DATE '${fi}'`
            } else if (fechaFin) {
                const ff = formatDateOnly(fechaFin, +1)
                where += ` AND FECHA <= DATE '${ff}'`
            }
*/
            console.log("WHERE:", where)

            console.log("consultarEstaciones:where >>> ", where)

            const response = await realizarConsulta(urlBase, layerId, where)

            // Validación de respuesta
            if (!response || !response.success || !response.data) return

            const resultado = response.data

            // Verificación de registros encontrados
            if (!resultado.features || resultado.features.length === 0) {
                alertService.warning(
                    'Sin resultados',
                    'No se encontraron resultados para los criterios seleccionados'
                )
                return
            }

            // Extracción limpia de datos
            const features = resultado.features
            const spatialReference = resultado.spatialReference
            const fields = resultado.fields?.map((f: any) => ({
                name: f.name,
                alias: f.alias
            })) || []

            abrirTablaResultados(features, fields, spatialReference)

        } catch (error) {
            console.error("Error consultando estaciones:", error)
        }

    }
    const consultarPrediosDeReforestacion = async (filters: any) => {

//        const { subcategoria, nombre, municipio } = filters;
        const { idMunicipio } = filters

        const urlBase = urls.AmbientalAlfanumerico.BASE
        const layerId = urls.AmbientalAlfanumerico.V_PREDIOREFORESTACION

        try {
//            const where = `IDMUNICIPIO = '${municipio}'`;
            const where = `IDMUNICIPIO = '${idMunicipio}'`

            console.log("consultarPrediosDeReporestacion:where >>> ", where)

            const response = await realizarConsulta(urlBase, layerId, where)

            // Validación de respuesta
            if (!response || !response.success || !response.data) return

            const resultado = response.data

            // Verificación de registros encontrados
            if (!resultado.features || resultado.features.length === 0) {
                alertService.warning(
                    'Sin resultados',
                    'No se encontraron resultados para los criterios seleccionados'
                )
                return
            }

            // Extracción limpia de datos
            const features = resultado.features
            const spatialReference = resultado.spatialReference
            const fields = resultado.fields?.map((f: any) => ({
                name: f.name,
                alias: f.alias
            })) || []

            abrirTablaResultados(features, fields, spatialReference)

        } catch (error) {
            console.error("Error consultando estaciones:", error)
        }

    }

    const realizarConsulta = async (
        urlBase: string,
        layerId: number,
        where: string,
    ): Promise<ApiResponse<ArcGisQueryResponse>> => {

        return await execute((signal) =>
            arcgisService.queryLayer<ArcGisQueryResponse>(
                urlBase,
                layerId,
                {
                    where,
                    returnGeometry: true
                },
                true,
                signal
            )
        )
    }

    const onBuscar = () => {
        console.log("onBuscar:Filtros enviados", filters)

        try {
            setLoading(true)

            const categoria = filters.categoria

            if (categoria === 1) { // Estaciones: meteorologica y limnigrafica
                consultarEstaciones(filters)
                return
            }
            if (categoria === 2) { // Puntos de calidad: calidadaire, calidadagua
                consultarPuntosDeCalidad(filters)
                return
            }
            if (categoria === 5) { // predios de reporestación
                consultarPrediosDeReforestacion(filters)
                return
            }

            consultarDemasCategorias() // 3=tramistes ambientales, 4=tramistes ambientales predios

        } finally {
            setLoading(false)
        }

    }

    const consultarDemasCategorias = async () => {

        console.log("consultarDemasCategorias", filters)

        const urlBase = urls.AmbientalAlfanumerico.BASE

        const categoria = CATEGORIAS.find(c => c.idCategoria === filters.categoria)
        const layerId = categoria?.layerId

        const campoFiltro1 = categoria?.campoFiltro1
        const campoFiltro2 = categoria?.campoFiltro2

        const valorFiltro1 = filters.subcategoria
//        const valorFiltro2 = filters.municipio
        const valorFiltro2 = filters.idMunicipio //  cef 20260324

        const where = `${campoFiltro1}='${valorFiltro1}' AND ${campoFiltro2}='${valorFiltro2}'`

        console.log("where??", where)
        console.log("layerId", layerId)

        try {
            setLoading(true)


                const response = await realizarConsulta(urlBase, layerId, where)
                // Si hubo error HTTP o servidor → ya se mostró alerta

                console.log('response >>> ', response)

                if (!response.success) return

                const resultado = response.data

                if (!resultado.features || resultado.features.length === 0) {
                    alertService.warning(
                        'Sin resultados',
                        'No se encontraron resultados para los criterios seleccionados'
                    )
                    return
                }

                const features = response.data?.features || []

                const spatialReference = response.data?.spatialReference

                const fields = response.data?.fields.map(f => ({
                    name: f.name,
                    alias: f.alias
                }))
                const withGraphics = true
                const graphicTitle = filters.subcategoria

                const dataset = [
                    { name: "Licencias", value: 65 },
                    { name: "Incautaciones", value: 80 },
                    { name: "Trámites", value: features.length }
                ]


                abrirTablaResultados(
                    features,
                    fields,
                    spatialReference,
                    withGraphics,
                    dataset,
                    "bar",
                    graphicTitle
                )

                //verGraficos(features, fields, spatialReference as __esri.SpatialReference) // con amCharts


        } finally {
            setLoading(false)
        }
    }
    const abrirTablaResultados = (
        features: any[],
        fields: any[],
        spatialReference?:
            __esri.SpatialReference,
        withGraphic?: boolean,
        graphicData?: any[],
        graphicType?: "bar" | "pie",
        graphicTitle?: string
    ) => {

        getAppStore().dispatch(appActions.openWidget(widgetResultId))

        getAppStore().dispatch(
            appActions.widgetStatePropChange(
                widgetResultId,
                'results',
                {
                    sourceWidgetId: props.id,
                    features: features,
                    fields: fields,
                    spatialReference: spatialReference,
                    withGraphic: withGraphic,
                    graphicTitle,
                    graphicData,
                    graphicType
                }
            )
        )
    }


    const onLimpiar = () => {

        clearFilters()
        abrirTablaResultados([], [], null, false)

    }

    return (

        <div className="consulta-ambiental">

            <FiltrosClasificacion
                filtros={filters}
                setFiltro={setFilter}
                opciones={opciones}
                handlers={handlers}
            />

            <SearchActionBar
                onSearch={onBuscar}
                onClear={onLimpiar}
                loading={loading}
                disableSearch={loading}
                helpText="Esta funcionalidad permite realizar consultas relacionadas de categorias ambientales"
            />

        </div>

    )

}
export default Widget