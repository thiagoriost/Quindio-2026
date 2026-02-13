/** @jsx jsx */
import { TextInput, Radio, Button, Label, Select, Option } from 'jimu-ui';
import { useRef, useEffect, useState } from 'react'

import { MUNICIPIOS_CONFIG, MunicipioConfig } from '../config/municipios.config';
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'
import Graphic from 'esri/Graphic'
import GraphicsLayer from 'esri/layers/GraphicsLayer'
import Polygon from 'esri/geometry/Polygon'
import { SearchActionBar } from '../../../shared/components/search-action-bar'
import './style.scss'
import { ArcgisService } from '../../../shared/services/arcgis.service';
//import { urls } from 'widgets/api/servicios';
import { urls } from '../../../api/servicios';

// Definimos la interfaz para evitar errores de tipo
interface MunicipioOption {
    value: string;
    label: string;
}
type TipoBusqueda = 'matricula' | 'predial';

const Widget = (props: any) => {
    // -----------------------------
    // STATE
    // -----------------------------
    const [municipios, setMunicipios] = useState<MunicipioOption[]>([])
    const [municipio, setMunicipio] = useState<string>('')
    const [tipoBusqueda, setTipoBusqueda] = useState<TipoBusqueda>('matricula');
    const [valorBusqueda, setValorBusqueda] = useState<string>('');
    const [mensaje, setMensaje] = useState<string | null>(null);

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const [jimuMapView, setJimuMapView] = useState<JimuMapView | null>(null)

    const jimuMapViewRef = useRef<JimuMapView | null>(null)
    const initializedRef = useRef(false)
    const initialExtentRef = useRef<any>(null)
    const graphicsLayerRef = useRef<GraphicsLayer | null>(null)

    const arcgisService = new ArcgisService()


    const MAPSERVER_BASE_URL =
        'https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/Catastro_Nuevo1/MapServer';

    interface ArcGisQueryResponse {
        features: any[];
    }

    // -----------------------------
    // Cargar municipios (WFS)
    // -----------------------------
    const cargarMunicipios = async () => {
        console.log('Cargando municipios...')

        setLoading(true)

        const response = await arcgisService.queryLayer<any>(
            urls.CARTOGRAFIA.BASE,
            urls.CARTOGRAFIA.MUNICIPIOS,
            {
                where: '1=1',
                outFields: 'IDMUNICIPIO,NOMBRE',
                returnGeometry: false
            }
        )

        if (!response.success) {
            setMensaje(response.error)
            return
        }

        
        const features = response.data.features
        console.log('Features municipios', features)

        const lista = features
            .map((f: any) => ({
                value: String(f.attributes.IDMUNICIPIO),
                label: f.attributes.NOMBRE
            }))
            .sort((a: any, b: any) => a.label.localeCompare(b.label))

        setMunicipios(lista)
        setLoading(false)
    }

    const cargarMunicipios_ant = async () => {
        try {
            setLoading(true)

            const url =

                'https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/CartografiaBasica/MapServer/75/' +
                'query?where=1%3D1&outFields=IDMUNICIPIO%2CNOMBRE&returnGeometry=false&f=pjson'

            const response = await fetch(url)

            if (!response.ok) {
                throw new Error('Error consultando municipios')
            }

            const geojson = await response.json()

            const lista = geojson.features
                .map((f: any) => ({
                    value: String(f.attributes.IDMUNICIPIO),
                    label: f.attributes.NOMBRE
                }))
                .sort((a: any, b: any) => a.label.localeCompare(b.label))

            setMunicipios(lista)

        } catch (e) {
            console.error(e)
            setError('No se pudieron cargar los municipios')
        } finally {
            setLoading(false)
        }
    }
    // -----------------------------
    // Ejecutar al iniciar
    // -----------------------------
    useEffect(() => {
        cargarMunicipios()
    }, [])

    useEffect(() => {

        console.log('useEffect de inicialización del MapView', { jimuMapView, state: props.state })

        const jmv = jimuMapViewRef.current

        if (!jmv) return

        // 🔥 Si está en Widget Controller, esperamos a que esté OPENED
        if (props.state && props.state !== 'OPENED') return

        // 🔥 Evitar inicializar dos veces
        if (initializedRef.current) return

        const view = jmv.view
        if (!view) return

        view.when(() => {

            console.log('View listo definitivamente:', view)

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

    // ------------------------------------------------
    // Pintar predio + zoom
    // ------------------------------------------------
    const pintarPredio = (feature: any) => {
        console.log('Pintando predio', feature);

        if (!jimuMapView || !graphicsLayerRef.current) return;

        graphicsLayerRef.current.removeAll();

        const geometry = Polygon.fromJSON(feature.geometry);
        geometry.spatialReference = jimuMapView.view.spatialReference;

        const graphic = new Graphic({
            geometry: geometry,
            symbol: {
                type: 'simple-fill',
                color: [255, 0, 0, 0.2],
                outline: { color: [255, 0, 0], width: 2 }
            },
            attributes: feature.attributes,
            // CONFIGURACIÓN DEL POPUP NATIVO
            popupTemplate: {
                title: "Detalles del Predio: {NUMEROPREDIAL}", // Usa llaves para campos
                content: [
                    {
                        type: "fields", // Formato tabla nativo
                        fieldInfos: [
                            { fieldName: "NUMEROPREDIAL", label: "Número Predial" },
                            { fieldName: "DIRECCION", label: "Dirección" },
                            { fieldName: "TIPO", label: "Zona" },
                            { fieldName: "SHAPE_AREA", label: "Área (m2)" },
                            { fieldName: "SHAPE_PERIMETRO", label: "Perímetro (m)" },
                        ]
                    }
                ]
            }
        });

        graphicsLayerRef.current.add(graphic);

        jimuMapView.view.goTo({
            target: graphic.geometry.extent.expand(2)
        });
    };
    // -----------------------------
    // HELPERS
    // -----------------------------
    const obtenerMunicipio = (): MunicipioConfig | undefined => {
        return MUNICIPIOS_CONFIG.find(m => m.dane === municipio);
    };
    const consultarMapServer = async (
        layerId: number,
        where: string
    ): Promise<ArcGisQueryResponse> => {
        const url = `${MAPSERVER_BASE_URL}/${layerId}/query`;

        console.log('Consultando MapServer con URL:', url, 'y where:', where);

        const jmv = jimuMapViewRef.current

        if (!jmv.view) {
            console.warn('MapView no listo aún')
            return
        }

        const view = jimuMapView.view

        const params = new URLSearchParams({
            f: 'json',
            where,
            outFields: '*',
            returnGeometry: 'true',
            //            outSR: JSON.stringify(jimuMapView.view.spatialReference.toJSON()), // Misma SR del mapa
            outSR: JSON.stringify(view.spatialReference.toJSON()),
            spatialRel: 'esriSpatialRelIntersects'
        });

        const response = await fetch(`${url}?${params.toString()}`);

        if (!response.ok) {
            throw new Error('Error consultando el servicio catastral');
        }

        const data = await response.json();
        return data;
    };

    const obtenerLayerId = (): number | null => {
        const municipio = obtenerMunicipio();
        if (!municipio) return null;

        return tipoBusqueda === 'matricula'
            ? municipio.layerId_matricula
            : municipio.layerId_predial;
    };

    // -----------------------------
    // BUSQUEDAS
    // -----------------------------
    const buscarPorMatricula = async (layerId: number) => {
        try {
            const where = `MATRICULA_INMOBILIARIA = '${valorBusqueda}'`;

            const resultado = await consultarMapServer(layerId, where);

            if (!resultado.features || resultado.features.length === 0) {
                setMensaje('No se encontraron resultados para la matrícula ingresada');
                return;
            }

            console.log('Resultado matrícula', resultado);
            pintarPredio(resultado.features[0])

        } catch (error) {
            console.error(error);
            setMensaje('Error consultando la matrícula inmobiliaria');
        }
    };

    const buscarPorPredial = async (layerId: number) => {
        try {
            const where = `NUMEROPREDIAL = '${valorBusqueda}'`;

            const resultado = await consultarMapServer(layerId, where);

            if (!resultado.features || resultado.features.length === 0) {
                setMensaje('No se encontraron resultados para el predial ingresado');
                return;
            }

            console.log('Resultado predial', resultado);
            pintarPredio(resultado.features[0])

        } catch (error) {
            console.error(error);
            setMensaje('Error consultando el número predial');
        }
    };

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

    const onLimpiar = () => {
        setMunicipio('');
        setTipoBusqueda('matricula');
        setValorBusqueda('');
        setMensaje(null);
        setError('');

        if (graphicsLayerRef.current) {
            graphicsLayerRef.current.removeAll();
        }

        if (jimuMapView && initialExtentRef.current) {
            jimuMapView.view.goTo(initialExtentRef.current);
        }
    };

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
                ⚠️ Debe seleccionar un Map Widget en la configuración.
            </div>
        )
    }
    // -----------------------------
    // UI render
    // -----------------------------
    return (
        console.log('useMapWidgetIds:', props.useMapWidgetIds),

        <div className="widget-consulta-predial" style={{ padding: 12 }}>

            {/* CONEXIÓN REAL AL MAPA */}
            <JimuMapViewComponent
                useMapWidgetId={props.useMapWidgetIds?.[0]}
                onActiveViewChange={(jmv: JimuMapView) => {
                    if (!jmv) return

                    console.log('onActiveViewChange')

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
            <div style={{ marginTop: 12 }}>
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
            </div>

            {/* Input búsqueda anterior */}
            <div style={{ marginTop: 12 }}>
                <TextInput
                    placeholder={
                        tipoBusqueda === 'matricula'
                            ? 'Ingrese matrícula inmobiliaria'
                            : 'Ingrese número predial'
                    }
                    value={valorBusqueda}
                    onChange={e => setValorBusqueda(e.target.value)}
                />
            </div>

            {/* Input búsqueda */}
            <div style={{ marginTop: 12 }}>
                {/* Ayuda contextual */}
                {!valorBusqueda && !mensaje && (
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        {tipoBusqueda === 'matricula'
                            ? 'Ejemplo Filandia: 0002001001284-4133'
                            : 'Ejemplo Filandia: 000000030326000'}
                    </div>
                )}
            </div>

            {/* Mensaje */}
            {mensaje && (
                <div style={{ marginTop: 8, color: 'red' }}>
                    {mensaje}
                </div>
            )}

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
