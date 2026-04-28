/** @jsx jsx */
import './style.scss'
import { TextInput, Radio, Label, Select, Option } from 'jimu-ui';
import { React, IMState } from 'jimu-core';
import { useSelector } from 'react-redux'
import { MUNICIPIOS_CONFIG, MunicipioConfig } from '../config/municipios.config';
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'
import Graphic from 'esri/Graphic'
import GraphicsLayer from 'esri/layers/GraphicsLayer'
import Polygon from 'esri/geometry/Polygon'
import { SearchActionBar } from '../../../shared/components/search-action-bar'
import { ArcgisService } from '../../../shared/services/arcgis.service';
import { urls } from '../../../api/servicios';
import { alertService } from '../../../shared/services/alert.service'
import { ApiResponse } from 'widgets/shared/models/api-response.model';
import { useOnWidgetClose } from '../../../shared/hooks/useOnWidgetClose';
import { usePopupManager } from '../../../shared/hooks/usePopupManager';
import { useCancelableHttp } from '../../../shared/hooks/useCancelableHttp';
import { appActions, getAppStore } from 'jimu-core'
import { WIDGET_IDS } from '../../../shared/constants/widget-ids'
import { Checkbox } from 'jimu-ui'
import { validaLoggerLocalStorage } from '../../../shared/utils/export.utils';
import { abrirTablaResultados, limpiarYCerrarWidgetResultados } from '../../../widget-result/src/runtime/widget';

/**
 * @file Widget de Consulta Catastral.
 * 
 * Permite realizar búsquedas de predios por:
 * - Matrícula inmobiliaria
 * - Número predial
 * 
 * El widget:
 * - Carga dinámicamente los municipios desde un servicio ArcGIS.
 * - Consulta capas MapServer según configuración por municipio.
 * - Resalta el predio encontrado en el mapa.
 * - Aplica zoom automático a la geometría.
 * - Registra popup reutilizable con opción de exportación.
 * - Cancela peticiones HTTP pendientes al cerrar el widget.
 * 
 * Requiere estar vinculado a un Map Widget en Experience Builder.
 */

/**
 * Representa una opción seleccionable de municipio en el dropdown.
 */
interface MunicipioOption {
    /** Código DANE del municipio */
    value: string;
    /** Nombre visible del municipio */
    label: string;
}

/**
 * Tipos de búsqueda soportados por el widget.
 * 
 * - `matricula`: búsqueda por matrícula inmobiliaria.
 * - `predial`: búsqueda por número predial.
 */
type TipoBusqueda = 'matricula' | 'predial';

/**
 * Componente principal del Widget de Consulta Predial.
 *
 * @param props - Propiedades entregadas por Experience Builder.
 * 
 * @remarks
 * - Utiliza `JimuMapViewComponent` para conectarse al mapa.
 * - Usa `ArcgisService` para consultas a servicios MapServer.
 * - Usa `useCancelableHttp` para cancelar peticiones activas.
 * - Usa `usePopupManager` para registrar popups reutilizables.
 * - Usa `useOnWidgetClose` para limpiar estado al cerrar.
 * 
 * @returns JSX.Element
 */
const Widget = (props: any) => {

    const { useRef, useEffect, useState } = React
    const [municipios, setMunicipios] = useState<MunicipioOption[]>([])
    const [municipio, setMunicipio] = useState<string>('')
    const [tipoBusqueda, setTipoBusqueda] = useState<TipoBusqueda>('predial');
    const [valorBusqueda, setValorBusqueda] = useState<string>('');
    const [mensaje, setMensaje] = useState<string | null>(null);

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const [jimuMapView, setJimuMapView] = useState<JimuMapView | null>(null)

    const jimuMapViewRef = useRef<JimuMapView | null>(null)
    const initializedRef = useRef(false)
    const initialExtentRef = useRef<any>(null)
    const graphicsLayerRef = useRef<GraphicsLayer | null>(null)
    const [capaTemporal, setCapaTemporal] = React.useState<boolean>(false) // 20260305

    const arcgisService = new ArcgisService()

    const { execute, cancelAll } = useCancelableHttp()

    const view = jimuMapView?.view ?? null
    // Hook reusable del popup
    const { registerPopup } = usePopupManager(view)

    // Cuando el mapa esté listo
    const handleActiveViewChange = (jmv: JimuMapView) => {
        setJimuMapView(jmv)
    }

    // obtener el estado del widget
    const widgetState = useSelector((state: IMState) =>
        state.widgetsRuntimeInfo?.[props.id]?.state
    )
    // y luego usarlo en useRef
    const prevState = useRef(widgetState)

    //
    const widgetResultId = WIDGET_IDS.RESULT


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

    /**
     * Carga los municipios desde el servicio ArcGIS configurado.
     * 
     * - Consulta la capa de municipios.
     * - Ordena alfabéticamente.
     * - Actualiza el estado `municipios`.
     * - Maneja estado de carga.
     */
    const cargarMunicipios = async () => {
        if (validaLoggerLocalStorage('logger')) console.log('Cargando municipios...')

        setLoading(true)

        const response = await execute((signal) =>
            arcgisService.queryLayer<any>(
                urls.CARTOGRAFIA.BASE,
                urls.CARTOGRAFIA.MUNICIPIOS,
                {
                    outFields: '*',
                    returnGeometry: true
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

        const lista = features
            .map((f: any) => ({
                value: String(f.attributes.IDMUNICIPIO),
                label: f.attributes.NOMBRE
            }))
            .sort((a: any, b: any) => a.label.localeCompare(b.label))

        setMunicipios(lista)
        setLoading(false)
    }

    // -----------------------------
    // Ejecutar al iniciar
    // -----------------------------
    useEffect(() => {
        if (validaLoggerLocalStorage('logger')) console.log('Cambio de estado del widget', { widgetState, prevState: prevState.current })
        if (widgetState === 'OPENED') {
            cargarMunicipios()
        }
    }, [widgetState])


    useEffect(() => {
        if (validaLoggerLocalStorage('logger')) console.log('useEffect de inicialización del MapView', { jimuMapView, state: props.state })

        const jmv = jimuMapViewRef.current

        if (!jmv) return

        // Si está en Widget Controller, esperamos a que esté OPENED
        if (props.state && props.state !== 'OPENED') return

        // Evitar inicializar dos veces
        if (initializedRef.current) return

        const view = jmv.view
        if (!view) return

        view.when(() => {

            if (validaLoggerLocalStorage('logger')) console.log('View listo definitivamente:', view)

            if (!initialExtentRef.current) {
                initialExtentRef.current = view.extent?.clone()
            }

            if (!graphicsLayerRef.current && view.map) {
                const layer = new GraphicsLayer({ id: 'predio-highlight' })
                view.map.add(layer)
                graphicsLayerRef.current = layer
            }

            initializedRef.current = true
        })

    }, [jimuMapView, props.state])


    /**
     * Dibuja el predio en el mapa y realiza zoom.
     * 
     * @param feature - Feature retornada desde el servicio ArcGIS.
     * 
     * @remarks
     * - Limpia gráficos previos.
     * - Convierte la geometría a `Polygon`.
     * - Aplica simbología de resaltado.
     * - Registra popup exportable.
     * - Hace zoom con factor de expansión 2.
     */
    const pintarPredio = (feature: any) => {

        if (validaLoggerLocalStorage('logger')) console.log('Pintando predio', feature)

        if (!jimuMapView || !graphicsLayerRef.current) return

        const view = jimuMapView.view

        graphicsLayerRef.current.removeAll()

        const geometry = Polygon.fromJSON(feature.geometry)
        geometry.spatialReference = view.spatialReference

        const graphic = new Graphic({
            geometry: geometry,
            symbol: {
                type: 'simple-fill',
                color: [255, 0, 0, 0.2],
                outline: { color: [255, 0, 0], width: 2 }
            },
            attributes: feature.attributes
        })

        // Registrar popup reusable (sin repetir estructura)
        registerPopup(graphic, {
            title: `Detalles del Predio: ${valorBusqueda}`,
            fileName: `Predio_${valorBusqueda}`,
            fields: [
                { fieldName: 'NUMEROPREDIAL', label: 'Número Predial' },
                { fieldName: 'DIRECCION', label: 'Dirección' },
                { fieldName: 'TIPO', label: 'Zona' },
                { fieldName: 'SHAPE_AREA', label: 'Área (m2)' },
                { fieldName: 'SHAPE_PERIMETRO', label: 'Perímetro (m)' }
            ]
        })

        graphicsLayerRef.current.add(graphic)

        // Zoom al predio
        view.goTo({
            target: graphic.geometry.extent.expand(2)
        })

    }
    /**
     * Obtiene la configuración del municipio seleccionado.
     * 
     * @returns Configuración del municipio o `undefined` si no existe.
     */
    const obtenerMunicipio = (): MunicipioConfig | undefined => {
        return MUNICIPIOS_CONFIG.find(m => m.dane === municipio);
    };

    /**
     * Realiza consulta a un MapServer específico.
     * 
     * @param layerId - ID de la capa dentro del servicio.
     * @param where - Expresión WHERE para filtrar.
     * 
     * @returns Promesa con `ApiResponse<ArcGisQueryResponse>`.
     * 
     * @remarks
     * - Usa `useCancelableHttp` para permitir cancelación.
     * - Retorna error si el MapView no está listo.
     */
    const consultarMapServer = async (
        layerId: number,
        where: string
    ): Promise<ApiResponse<ArcGisQueryResponse>> => {

        const jmv = jimuMapViewRef.current

        if (!jmv?.view) {
            console.warn('MapView no listo aún')
            return {
                success: false,
                error: 'MapView no está listo'
            }
            return null
        }

        return await execute((signal) =>
            arcgisService.queryLayer<ArcGisQueryResponse>(
                urls.Catastro_Nuevo1.BASE,
                layerId,
                { where },
                true,
                signal
            )
        )
    }

    /**
     * Obtiene el layerId configurado según:
     * - Municipio seleccionado
     * - Tipo de búsqueda (matrícula o predial)
     * 
     * @returns ID de capa o `null` si no está configurado.
     */
    const obtenerLayerId = (): number | null => {
        const municipio = obtenerMunicipio();
        if (!municipio) return null;

        return tipoBusqueda === 'matricula'
            ? municipio.layerId_matricula
            : municipio.layerId_predial;
    };

    /**
     * Callback ejecutado cuando el widget se cierra.
     * 
     * - Cancela peticiones HTTP activas.
     * - Limpia estado.
     */
    const onClose = () => {
        if (validaLoggerLocalStorage('logger')) console.log('Widget cerrado')

       limpiarYCerrarWidgetResultados(widgetResultId) // cierra el widget de resultados al cerrar este widget de consulta catastral
        cancelAll()
        onLimpiar()
    }

    /**
     * Ejecuta búsqueda por matrícula inmobiliaria.
     * 
     * @param layerId - ID de la capa configurada.
     * 
     * @remarks
     * - Construye cláusula WHERE.
     * - Muestra alerta si no hay resultados.
     * - Pinta el primer resultado encontrado.
     * 
     */
    const buscarPorMatricula = async (layerId: number) => {
        try {
            const where = `MATRICULA_INMOBILIARIA = '${valorBusqueda}'`;

            const response = await consultarMapServer(layerId, where);

            // Si hubo error HTTP o servidor → ya se mostró alerta
            if (!response.success) return

            const resultado = response.data

            if (!resultado.features || resultado.features.length === 0) {
                alertService.warning(
                    'Sin resultados',
                    'No se encontraron resultados para la matrícula ingresada'
                )
                return
            }

            if (validaLoggerLocalStorage('logger')) console.log('Resultado matrícula', resultado);
            const features = response.data?.features || []

            // porque la aconsulta devuelve dos registros con la misma matrícula
            const firstFeatureArray = features.length ? [features[0]] : []
            const spatialReference = response.data?.spatialReference

            /* const fields = [
                { name: 'NUMEROPREDIAL', alias: 'Número Predial(20)' },
                { name: 'NUMEROPREDIAL1', alias: 'Número Predial(30)' },
                { name: 'MATRICULA_INMOBILIARIA', alias: 'Matrícula Inmobiliaria' },
                { name: 'TIPO', alias: 'Tipo' },
                { name: 'NOMBRE', alias: 'Municipio' },
                { name: 'SHAPE_AREA', alias: 'Área (m²)', type: 'number' },
                { name: 'SHAPE_PERIMETRO', alias: 'Perímetro (m)', type: 'number' }
            ] */
            const fields = response.data.fields

            abrirTablaResultados(false, firstFeatureArray, fields, props, widgetResultId , spatialReference as __esri.SpatialReference, undefined, capaTemporal, valorBusqueda)

//            pintarPredio(resultado.features[0])  ahora lo pinta WidgetResult

        } catch (error) {
            console.error(error);
            setMensaje('Error consultando la matrícula inmobiliaria');
        }
    };

    /**
     * Ejecuta búsqueda por número predial.
     * 
     * @param layerId - ID de la capa configurada.
     * 
     * @remarks
     * - Construye cláusula WHERE.
     * - Muestra alerta si no hay resultados.
     * - Pinta el primer resultado encontrado.
     */
    const buscarPorPredial = async (layerId: number) => {
        try {
            let where = ''
            if (valorBusqueda.length === 15) {
                where = `NUMEROPREDIAL = '${valorBusqueda}'`
            } else if (valorBusqueda.length === 25) {
                where = `(NUMEROPREDIAL1 = '${valorBusqueda}')`
            }

            const response = await consultarMapServer(layerId, where)
            // Si hubo error HTTP o servidor → ya se mostró alerta

            if (!response.success) return

            const resultado = response.data

            if (!resultado.features || resultado.features.length === 0) {
                alertService.warning(
                    'Sin resultados',
                    'No se encontraron resultados para el predial ingresado...'
                )
                return
            }

            //  pintarPredio(resultado.features[0]), ahora lo pinta WidgetResult

            if (validaLoggerLocalStorage('logger')) console.log('Respuesta consulta predial', response)
            const features = response.data?.features || []

            // porque l aconsulta devuelve dos registros con el mismo número predial 
            const firstFeatureArray = features.length ? [features[0]] : []
            const spatialReference = response.data?.spatialReference

            const fields = response.data.fields

            abrirTablaResultados(false, firstFeatureArray, fields, props, widgetResultId , spatialReference as __esri.SpatialReference, undefined, capaTemporal, valorBusqueda)


        } catch (error) {
            console.error(error)

            // Solo errores inesperados del código
            alertService.error(
                'Error inesperado',
                'Ocurrió un problema consultando el número predial'
            )
        }
    }

    /**
     * Método principal ejecutado al presionar "Buscar".
     * 
     * Validaciones:
     * - Municipio seleccionado.
     * - Valor ingresado.
     * - Formato correcto según tipo de búsqueda.
     * - Existencia de layer configurado.
     * 
     * Maneja estado `loading`.
     */
    const onBuscar = async () => {
        setMensaje(null);

        if (!municipio) {
            setMensaje('Seleccione un municipio');
            return;
        }

        if (!valorBusqueda.trim()) {
            setMensaje('Ingrese un valor de búsqueda');
            return;
        }

        if (!validarBusqueda()) {
            return;
        }

        const layerId = obtenerLayerId();

        if (!layerId) {
            setMensaje(
                `El municipio no tiene capa configurada para ${tipoBusqueda === 'matricula' ? 'matrícula' : 'predial'
                }`
            );
            return;
        }
        try {
            setLoading(true);

            if (tipoBusqueda === 'matricula') {
                await buscarPorMatricula(layerId);
            } else {
                await buscarPorPredial(layerId);
            }
        } finally {
            setLoading(false);
        }
    };

    /**
     * Limpia el formulario y restablece el mapa.
     * 
     * - Reinicia estados.
     * - Elimina gráficos.
     * - Regresa al extent inicial del mapa.
     */
    const onLimpiar = () => {
        setMunicipio('');
        setTipoBusqueda('predial');
        setValorBusqueda('');
        setMensaje(null);
        setError('');
        setCapaTemporal(false);
//      eliminarGraficos();  // si se habilita no funciona las capas temporales porque se eliminan al limpiar, se podría mejorar para que solo elimine el gráfico del predio y no las capas temporales que se agreguen
    };

    /**
     * - Elimina gráficos.
     * - Regresa al extent inicial del mapa.
     */
    const eliminarGraficos = () => {
        if (graphicsLayerRef.current) {
            graphicsLayerRef.current.removeAll();
        }

        if (jimuMapView && initialExtentRef.current) {
            jimuMapView.view.goTo(initialExtentRef.current);
        }
    };

    /**
     * Valida el formato del valor de búsqueda.
     * 
     * Reglas:
     * - Predial: exactamente 15 o 25 dígitos numéricos.
     * - Matrícula: debe contener guion (-).
     * 
     * @returns `true` si es válido, `false` si no.
     */
    const validarBusqueda = (): boolean => {
        if (tipoBusqueda === 'predial') {
            const regexPredial = /^(\d{15}|\d{25})$/;
            if (!regexPredial.test(valorBusqueda)) {
                setMensaje('El número predial debe contener exactamente 15 o 25 dígitos numéricos');
                return false;
            }
        }

        if (tipoBusqueda === 'matricula') {
            if (!valorBusqueda.includes('-')) {
                setMensaje('La matrícula inmobiliaria debe contener un guion (-)');
                return false;
            }
        }

        return true;
    };
    /**
     * Cuando el widget está en un Widget Controller se crea una nueva instancia y puede no tener
     * MapWidget configurado. En ese caso `useMapWidgetIds` es undefined y el MapView nunca se crea.
     * 
     * Se usa early return para evitar errores `.view null`.
     */
    if (!props.useMapWidgetIds?.length) {
        return (
            <div style={{ padding: 16 }}>
                Debe seleccionar un Map Widget en la configuración.
            </div>
        )
    }

    /**
     * Hook personalizado que detecta cuando el widget cambia a estado cerrado.
     *
     * @param props.id - Identificador único del widget dentro de Experience Builder.
     * @param onClose - Callback ejecutado automáticamente cuando el estado del widget pasa a `CLOSED`.
     *
     * @remarks
     * - Observa el estado del widget en el store global (`IMState`).
     * - Permite ejecutar lógica de limpieza al cerrar el widget.
     * - En este caso:
     *   - Cancela todas las peticiones HTTP activas (`cancelAll()`).
     *   - Limpia formulario y gráficos del mapa (`onLimpiar()`).
     *
     * @example
     * useOnWidgetClose(props.id, onClose)
     */
    useOnWidgetClose(props.id, jimuMapView, initialExtentRef.current, onClose)

    // -----------------------------
    // UI render
    // -----------------------------
    return (
        <div className="widget-consulta-predial" style={{ padding: 12 }}>

            {/* CONEXIÓN REAL AL MAPA */}
            <JimuMapViewComponent
                useMapWidgetId={props.useMapWidgetIds?.[0]}
                onActiveViewChange={(jmv: JimuMapView) => {

                    if (!jmv) return

                    jimuMapViewRef.current = jmv
                    setJimuMapView(jmv)
                }}
            />

            {/* Municipio */}
            <Label>Municipio</Label>
            <Select
                value={municipio}
                disabled={loading}
                onChange={e => {
                    onLimpiar();
                    setMunicipio(e.target.value);
                }}
            >
                <Option value="">
                    {loading ? 'Cargando municipios...' : 'Seleccione...'}
                </Option>

                {municipios.map(m => (
                    <Option key={m.value} value={m.value}>
                        {m.label}
                    </Option>
                ))}
            </Select>

            {error && (
                <div style={{ color: 'red', marginTop: 4 }}>
                    {error}
                </div>
            )}

            {/* Tipo de búsqueda */}
            {/* <div style={{ marginTop: 12 }}>
                <Label>
                    <Radio
                        checked={tipoBusqueda === 'matricula'}
                        onChange={() => {
                            setTipoBusqueda('matricula');
                            setValorBusqueda('');
                        }}
                    />
                    Matrícula inmobiliaria
                </Label>

                <Label style={{ marginLeft: 12 }}>
                    <Radio
                        checked={tipoBusqueda === 'predial'}
                        onChange={() => {
                            setTipoBusqueda('predial');
                            setValorBusqueda('');
                        }}
                    />
                    Número predial
                </Label>
            </div> */}

            {/* Input búsqueda */}
            <div style={{ marginTop: 12 }}>
                <TextInput
                    placeholder={
                        tipoBusqueda === 'matricula'
                            ? 'Ingrese matrícula inmobiliaria'
                            : 'Ingrese número predial'
                    }
                    value={valorBusqueda}
                    onChange={e => {
                        setValorBusqueda(e.target.value);
                        if (mensaje) {
                            setMensaje('');
                        }
                    }}

                />

                {/* Ayuda contextual */}
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    {tipoBusqueda === 'matricula'
                        ? 'Ejemplo Filandia: 0002001001284-4133'
                        : 'Ejemplo Filandia: 000000030326000'}
                </div>

                {/* Checkbox capa temporal */}
                <div style={{ marginTop: 8 }}>
                    <Label>
                        <Checkbox
                            checked={capaTemporal}
                            onChange={(e, checked) => setCapaTemporal(checked)}
                        />
                        <span style={{ marginLeft: 6 }}>Capa temporal</span>
                    </Label>
                </div>

                {/* Mensaje */}
                {mensaje && (
                    <div style={{ marginTop: 4, color: 'red', fontSize: 12 }}>
                        {mensaje}
                    </div>
                )}
            </div>


            {/* Botón */}
            <SearchActionBar
                onSearch={onBuscar}
                onClear={onLimpiar}
                loading={loading}
                disableSearch={loading}
                helpText="Esta funcionalidad permite buscar predios por matrícula inmobiliaria o número predial"
            />
        </div>
    );
};
export default Widget;
