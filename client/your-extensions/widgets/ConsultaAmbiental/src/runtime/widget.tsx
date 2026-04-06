/** @jsx jsx */

import { React } from 'jimu-core'
import { useCascadingFilters } from './hooks/useCascadingFilters'
import { FiltrosClasificacion } from './components/FiltrosClasificacion'
import { SearchActionBar } from '../../../shared/components/search-action-bar'
import { ArcgisService } from '../../../shared/services/arcgis.service'
import { alertService } from '../../../shared/services/alert.service'
import { urls } from '../../../api/serviciosQuindio'
import type { ApiResponse } from 'widgets/shared/models/api-response.model'
import { useCancelableHttp } from '../../../shared/hooks/useCancelableHttp'

import { WIDGET_IDS } from '../../../shared/constants/widget-ids'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import FeatureLayer from "esri/layers/FeatureLayer"
import { consultarCapasAmbientales, obtenerOpcionesNombres } from '../services/ambiental.service'

import {
    AREAS,
    CATEGORIAS,
    SUBCATEGORIAS_ESTACIONES,
    SUBCATEGORIAS_PUNTOSDECALIDAD,
    toOptions
} from './config/consulta-ambiental.config'
import { abrirTablaResultados, limpiarYCerrarWidgetResultados } from '../../../widget-result/src/runtime/widget'
import './styles/consulta-ambiental.css'


const Widget = (props: any) => {

    const [mensaje, setMensaje] = React.useState<string | null>(null)

    const widgetResultId = WIDGET_IDS.RESULT


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

    const [jimuMapView, setJimuMapView] = React.useState<JimuMapView | null>(null)

    React.useEffect(() => {
        if (!jimuMapView) return

        console.log("Mapa listo:", jimuMapView)

    }, [jimuMapView])

    /**
     * Efecto que limpia el punto y restaura la vista inicial cuando el widget se cierra.
     */
    React.useEffect(() => {
    if (props.state === 'CLOSED') {
        clearFilters()
        setMensaje(null)
        limpiarYCerrarWidgetResultados(widgetResultId)
    }  
    
    }, [props])

    const handlers = {

        onChangeAreaTematica: (categoria: number) => {
            console.log('onChangeAreaTematica:', categoria)

            handlers.cargarMunicipios_All()

            if (categoria === 2) {
                handlers.activarCuencaLaVieja()
            } else {
                if (!jimuMapView?.view) return

                const map = jimuMapView.view.map
                const layer = map.findLayerById("cuenca-la-vieja-feature") as __esri.FeatureLayer

                if (layer) {
                    layer.visible = false
                }
            }
        },
        onChangeSubcategoria: (subcategoria: string, filtro: any, filtros: { categoria: any }, setFiltro: (arg0: string, arg1: any) => void) => {
            console.log("onChangeSubcategoria:filtros ", filtros)
            const categoriaId = filtros.categoria

            // buscar el objeto completo (id + name)
            const selected = opciones.subcategorias.find(
                (s: any) => s.value === subcategoria
            )

            const nombreSubCat = selected?.label ?? ""

            setFiltro("subcategoria", subcategoria)
            setFiltro("subcategorianombre", nombreSubCat)

            const categoria = CATEGORIAS.find(c => c.idCategoria === categoriaId)

            if (!categoria) return

            const categoriaNombre = categoria.categoria.toLowerCase()

            // CASO ESTACIONES y PUNTOS DE CALIDAD
            if (["estaciones", "puntos de calidad"].includes(categoriaNombre)) {
                handlers.cargarNombres(subcategoria)

            }
        },
        onChangeEstacion: (nombreSeleccionado: any, filtro: any, filtros: any, setFiltro: (arg0: string, arg1: string) => void) => {

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

        cargarSubcategorias: (categoriaId: number, filtro: { casosEspeciales: { [x: string]: any } }, filtros: any, setFiltro: any) => {

            const categoria = CATEGORIAS.find(c => c.idCategoria === categoriaId)
            const categoriaNombre = categoria?.categoria?.toLowerCase()

            console.log("cargarSubcategorias >>> ", categoriaNombre)

            // revisar si hay caso especial, aplica para estaciones y puntos de calidad
            const casoEspecialNombre = filtro.casosEspeciales?.[categoriaNombre]
            const casoEspecial = filtro.casosEspeciales
            console.log("casoEspecial >>> ", casoEspecial)
            console.log("casoEspecialNombre >>> ", casoEspecialNombre)

            if (casoEspecialNombre) {

                const datos = catalogosEspeciales[casoEspecialNombre as keyof typeof catalogosEspeciales]

                setOpciones(prev => ({
                    ...prev,
                    subcategorias: toOptions(datos, "subcategoria", "idSubCategoria")
                }))

                return
            }

            switch (categoriaId) {
                case 3: { // Tramites ambientales"
                    handlers.cargarTramitesAmbientales()
                    break
                }
                case 4: { // Tramites ambientales predios
                    handlers.cargarTramitesAmbientalesPredios(categoriaId)
                    break
                }
                case 5: { // predios forestales, no tiene subcategorias.
                    break
                }
                default: {
                    break
                }
            }

        },

        cargarTramitesAmbientales: async () => { // subcategoria
            //            console.log("cargarTramitesAmbientales >>> ")
            const url = urls.DemandaRecursosNaturales._LAYERS

            const subcategorias = await getSubLayersOptions(url)

            console.log("cargarTramitesAmbientales >>> ", subcategorias)

            setOpciones(prev => ({
                ...prev,
                subcategorias
            }))
        },
        cargarTramitesAmbientalesPredios: async (categoriaId: number) => { // subcategoria
            console.log("cargarTramitesAmbientalesPredios >>> ", categoriaId)
            const urlBase = urls.AmbientalAlfanumerico.BASE
            const layerId = urls.AmbientalAlfanumerico.TRAMITESCATASTRO // DESCRIPCIONVALOR

            const categoria = CATEGORIAS.find(c => c.idCategoria === categoriaId)
            const outField = categoria?.campoFiltro1

            const response = await handlers.consultarMapServer(urlBase, layerId, outField)

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
                }))

            setOpciones(prev => ({
                ...prev,
                subcategorias
            }))

        },
        cargarNombresEstaciones: async (idSubcategoria: string) => {
            console.log("cargarNombresEstaciones >>> ", idSubcategoria)

            setLoading(true)

            const urlBase = urls.Ambiental.BASE
            let layerId = null
            const outField = "NOMBRE, IDMUNICIPIO"

            if (idSubcategoria === "metereologica") { // Metereológica
                layerId = urls.Ambiental.Estaciones_climaticas

            }
            if (idSubcategoria === "limnigrafica") { // Limnigráfica
                layerId = urls.Ambiental.Estaciones_limnigraficas
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

            // regla no deben existir el mismo nombre de estacion en mas de un municipios
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
        },

        cargarNombresPuntosDeCalidad: async (idSubcategoria: string) => {
            console.log('cargarNombresPuntosDeCalidad:', idSubcategoria)

            setLoading(true)

            const urlBase = urls.Ambiental.BASE
            let layerId = null
            const outField = "NOMBRE, IDMUNICIPIO"
            if (idSubcategoria === "calidadagua") { // Calidad del agua
                layerId = urls.Ambiental.Monitoreo_calidad_agua
            }
            if (idSubcategoria === "calidadaire") { // Calidad del aire
                layerId = urls.Ambiental.Monitoreo_calidad_aire
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

            // regla no deben existir el mismo nombre de estacion en mas de un municipios
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
        cargarNombres: async (subcategoria: string) => {
            console.log("cargarNombres >>> ", subcategoria)

            setLoading(true)

            try {
                const opcionesNombres = await obtenerOpcionesNombres(subcategoria, {
                    consultarMapServer: handlers.consultarMapServer
                })

                setOpciones(prev => ({
                    ...prev,
                    nombres: opcionesNombres
                }))

            } catch (error) {
                console.error("Error cargando nombres:", error)
            } finally {
                setLoading(false)
            }
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

        activarCuencaLaVieja: async () => {
            console.log('activarCuencaLaVieja:', filters)


            if (!jimuMapView?.view) return

            const view = jimuMapView.view
            const map = view.map

            const layerId = "cuenca-la-vieja-feature"

            // Config
            const urlBase = urls.CuencaLaVieja?.BASE
            const sublayerId = urls.CuencaLaVieja?.Suelos

            if (!urlBase || sublayerId === undefined) {
                console.warn("Configuración de CuencaLaVieja incompleta")
                return
            }

            const fullUrl = `${urlBase}/${sublayerId}`

            let layer = map.findLayerById(layerId) as __esri.FeatureLayer

            if (!layer) {
                layer = new FeatureLayer({
                    url: fullUrl,
                    id: layerId,
                    outFields: ["*"],
                    visible: true
                })

                map.add(layer)
            } else {
                // Si ya existe, solo asegurar que esté visible
                layer.visible = true
            }

            try {
                await layer.when()

                const result = await layer.queryExtent()

                if (result?.extent) {
                    await view.goTo(result.extent.expand(1.2), {
                        duration: 1200
                    })
                } else {
                    console.warn("No se pudo obtener extent de la capa")
                }

            } catch (e) {
                console.error("Error en activarCuencaLaVieja:", e)
            }
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
                        // extraParams: 'returnDistinctValues=true&orderByFields=' + outFields,
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
        filtrarMunicipios: () => {
            console.log('Filtrar Municipios...')
        },
        consultarMapServer: async (
            urlBase: string,
            layerId: number,
            outField: string,
        ): Promise<ApiResponse<ArcGisQueryResponse>> => {
            console.log("consultarMapServer >>> ", { urlBase, layerId, outField })
            return await execute((signal) =>
                arcgisService.queryLayer<ArcGisQueryResponse>(
                    urlBase,
                    layerId,
                    {
                        outFields: outField,
                        // extraParams: 'returnDistinctValues=true&orderByFields=' + outField,
                        returnGeometry: false
                    },
                    true,
                    signal
                )
            )
        }
    }

    async function getSubLayersOptions(url: string): Promise<Array<{ label: string; value: number }>> {

        console.log('getSubLayersOptions...')
        const response = await fetch(url)
        const data = await response.json()

        return data.layers
            .filter((layer: any) => layer.parentLayer?.id === 10)
            .map((layer: any) => ({
                label: layer.name, // lo que ve el usuario
                value: layer.id // lo que usas internamente
            }))
    }
    const consultarPrediosDeReforestacion = async (filters: any) => {
        console.log("consultarPrediosDeReforestacion >>> ", filters)
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

            abrirTablaResultados(features, fields, props, widgetResultId, spatialReference)

        } catch (error) {
            console.error("Error consultando estaciones:", error)
        }

    }

    const realizarConsulta = async (
        urlBase: string,
        layerId: number,
        where: string,
    ): Promise<ApiResponse<ArcGisQueryResponse>> => {

        console.log("realizarConsulta >>> ", { urlBase, layerId, where })


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

    const onBuscar = async () => {
console.log('onBuscar:', filters)
        const { categoria } = filters

        if (categoria === 3) { // Trámites ambientales
            await consultarTramitesAmbientales(filters)
            return
        }
        if (categoria === 4) { //Trámites ambientales predios
            consultarPrediosDeReforestacion(filters)
            return
        }

        if (categoria === 5) { // predios de reporestación
            consultarPrediosDeReforestacion(filters)
            return
        }

        await consultarCapasAmbientales(filters, {
            realizarConsulta,
            alertService,
            abrirTablaResultados
        })


    }

    const consultarTramitesAmbientales = async (filters: any) => {
        console.log('consultarTramitesAmbientales:', filters)

        const { categoria, idMunicipio, fechaInicio, fechaFin } = filters

        if (!fechaInicio || !fechaFin) {
            alertService.warning('Fecha inicio y fecha fin son requeridas para la consulta')
            return
        }

        const formatDateOnly = (ts: number, offsetDays = 0) => {
            const d = new Date(ts)

            // mover días (clave de tu solución)
            d.setDate(d.getDate() + offsetDays)

            const yyyy = d.getFullYear()
            const mm = String(d.getMonth() + 1).padStart(2, '0')
            const dd = String(d.getDate()).padStart(2, '0')

            return `${yyyy}-${mm}-${dd}`
        }

        const urlBase = urls.DemandaRecursosNaturales.BASE
        const layerId = filters.subcategoria

        const categoriaSelct = CATEGORIAS.find(c => c.idCategoria === categoria)

        const campoFiltro2 = categoriaSelct?.campoFiltro2 // IDMUNICIPIO
        const valorFiltro2 = idMunicipio

        let where = `${campoFiltro2}='${valorFiltro2}'`

        //ej: 24 de abril de 2010 = 1272067200000 (2 en Armenia)

        if (fechaInicio && fechaFin) {
            const fi = formatDateOnly(fechaInicio, -1) // -1 día, para evitar errores de limite timestamp
            const ff = formatDateOnly(fechaFin, +1) // +1 día
            where += ` AND FECHARESOLUCION BETWEEN DATE '${fi}' AND DATE '${ff}'`
        } else if (fechaInicio) {
            const fi = formatDateOnly(fechaInicio, -1)
            where += ` AND FECHARESOLUCION >= DATE '${fi}'`
        } else if (fechaFin) {
            const ff = formatDateOnly(fechaFin, +1)
            where += ` AND FECHARESOLUCION <= DATE '${ff}'`
        }

        try {
            setLoading(true)

            const response = await realizarConsulta(urlBase, layerId, where)
            // Si hubo error HTTP o servidor → ya se mostró alerta

            if (!response.success) return

            const resultado = response.data

            if (!resultado.features || resultado.features.length === 0) {
                alertService.warning(
                    'Sin resultados',
                    'No se encontraron resultados para los criterios seleccionados'
                )
                limpiarYCerrarWidgetResultados(widgetResultId)
                return
            }

            const features = response.data?.features || []

            const spatialReference = response.data?.spatialReference

            const fields = response.data?.fields.map(f => ({
                name: f.name,
                alias: f.alias
            }))

            const graphicTitle = filters.subcategorianombre

            const dataset = [
                { name: "Trámites", value: features.length }
            ]

            const withGraphic = {
                showGraphic: true,
                graphicData: dataset,
                graphicType: "bar",
                graphicTitle: graphicTitle
            }

            abrirTablaResultados(
                features,
                fields,
                props,
                widgetResultId,
                spatialReference,
                withGraphic
            )

        } finally {
            setLoading(false)
        }
    }

    const onLimpiar = () => {
        clearFilters()
        setMensaje("Filtros limpiados")
        setTimeout(() => limpiarYCerrarWidgetResultados(widgetResultId), 5000)
        
    }

    React.useEffect(() => {
      console.log({filters, opciones})
    }, [])
    
    return (

        <div style={{height: '100%', padding: '5px', boxSizing: 'border-box'}}>

            {/* Componente de acceso al MapView cef 20250327 */}
            <JimuMapViewComponent
                useMapWidgetId={props.useMapWidgetIds?.[0]}
                onActiveViewChange={(view) => {
                    setJimuMapView(view)
                }}
            />

            <div className="consulta-widget consulta-scroll">
              <FiltrosClasificacion
                  filtros={filters}
                  setFiltro={setFilter}
                  opciones={opciones}
                  handlers={handlers}
              />
              {/* Mensaje */}
              {mensaje && (
                  <div style={{ marginTop: 4, color: 'red', fontSize: 12 }}>
                      {mensaje}
                  </div>
              )}
              <br />
              <SearchActionBar
                  onSearch={onBuscar}
                  onClear={onLimpiar}
                  loading={loading}
                  disableSearch={loading}
                  helpText="Esta funcionalidad permite realizar consultas relacionadas de categorias ambientales"
              />
            </div>
        </div>

    )

}
export default Widget