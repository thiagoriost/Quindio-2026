/** @jsx jsx */
import { React, jsx, AllWidgetProps } from 'jimu-core'
const { useEffect, useState, useRef } = React
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'
import { IMConfig } from '../config';
import { Link } from 'jimu-ui';

import SelectDesdeArray from '../../../consulta-salud/src/runtime/components/SelectDesdeArray';
import SelectMunicipio, { listaMunicipios } from '../../../consulta-salud/src/runtime/components/SelectMunicipio';
import { ArcGisFeature, ArcGisField, SelectOption } from '../../../consulta-salud/src/runtime/types';
import { useCancelableHttp } from '../../../shared/hooks/useCancelableHttp';
import { ArcgisService } from '../../../shared/services/arcgis.service';
import { handleError } from '../../../consulta-salud/src/runtime/util';
import { ConsultaComponentHandle } from '../../../consulta-salud/src/runtime/consulta-general-types';
import ConsultaNormatividad from './components/ConsultaNormatividad';
import { SearchActionBar } from '../../../shared/components/search-action-bar';
import ConsultaEstrato from './components/ConsultaEstrato';
import { useDibujarFeatures } from '../../../shared/hooks/useDibujarFeatures';
import ConsultaClasificacion from './components/ConsultaClasificacion';

const arcgisService = new ArcgisService()

export default function Widget (props: AllWidgetProps<IMConfig>) {
    const tiposConsulta = [
        { value: 'normatividad', label: 'Normatividad de uso del suelo' },
        { value: 'estrato', label: 'Viviendas por estrato socioeconómico' },
        { value: 'clasificacion', label: 'Clasificación de uso del suelo' }
    ];

    const [tipoConsulta, setTipoConsulta] = useState('normatividad');
    const [municipios, setMunicipios] = useState<SelectOption[]>([])
    const [idMunicipio, setIdMunicipio] = useState<string>('')
    const [loading, setLoading] = useState(false);
    const [jimuMapView, setJimuMapView] = useState<JimuMapView | null>(null);
    const [mensaje, setMensaje] = useState('');
    const [urlFicha, setUrlFicha] = useState('');

    const [resultadosADibujar, setResultadosADibujar] = useState<{
        features: ArcGisFeature[]
        fields: ArcGisField[]
        spatialReference?: __esri.SpatialReference
    } | null>(null);

    const { execute, cancelAll } = useCancelableHttp()
    const cancelAllRef = useRef(cancelAll);

    useEffect(() => {
        const cargarMunicipios = async () => {
            setLoading(true)
            const lista = await listaMunicipios(execute, arcgisService)
            setLoading(false);
            setMunicipios (lista);            
        }          

        void cargarMunicipios();      
    }, []);

    useEffect(() => {
        return () => {
            cancelAllRef.current()
        }
    }, []);   

    useEffect(() => {
        cancelAllRef.current = cancelAll
    }, [cancelAll]);
   
    const refs = {
        normatividad: useRef<ConsultaComponentHandle>(null),
        estrato: useRef<ConsultaComponentHandle>(null),
        clasificacion: useRef<ConsultaComponentHandle>(null)
    }

    useDibujarFeatures({
        jimuMapView,
        features: resultadosADibujar?.features ?? [],
        fields: resultadosADibujar?.fields ?? [],
        spatialReference: resultadosADibujar?.spatialReference,
        layerId: 'consulta-ordenamiento-territorial',
        groupLayerId: 'capas-temporales',
        title: 'Resultados ordenamiento territorial',
        enabled: true
    })

    const consultar = async () => {
        const result = await refs[tipoConsulta].current.consultar();        
        setMensaje(`${result?.features?.length ?? 0} registros`)
        setResultadosADibujar(result)
    }

    const limpiar = () => {
        setResultadosADibujar(null);
        setMensaje('');
        refs[tipoConsulta].current.limpiar();
    }

    return (
        <div style={{background:"#edc"}}>             
            <div style={{ position: 'absolute', width: 0, height: 0 }}>
                <JimuMapViewComponent
                useMapWidgetId={props.useMapWidgetIds?.[0]}
                onActiveViewChange={setJimuMapView}
                />
            </div>

            <SelectDesdeArray label={"Consulta por"} valor={tipoConsulta} setValor={setTipoConsulta} 
            array={tiposConsulta} disabled={loading} />

            {tipoConsulta === 'normatividad' && (
                <ConsultaNormatividad url={props.config.endpointOrdenamientoTerritorial} execute={execute} arcgisService={arcgisService}
                handleError={handleError} loading={loading} setLoading={setLoading} municipios={municipios} idMunicipio={idMunicipio} 
                setIdMunicipio={setIdMunicipio} setUrlFicha={setUrlFicha} ref={refs.normatividad} />
            )}

            {tipoConsulta === 'estrato' && (
                <ConsultaEstrato url={props.config.endpointOrdenamientoTerritorial} execute={execute} arcgisService={arcgisService}
                handleError={handleError} loading={loading} setLoading={setLoading} municipios={municipios} idMunicipio={idMunicipio} 
                setIdMunicipio={setIdMunicipio} ref={refs.estrato} />
            )}
            
            {tipoConsulta === 'clasificacion' && (
                <ConsultaClasificacion url={props.config.endpointOrdenamientoTerritorial} execute={execute} arcgisService={arcgisService}
                handleError={handleError} loading={loading} setLoading={setLoading} municipios={municipios} idMunicipio={idMunicipio} 
                setIdMunicipio={setIdMunicipio} ref={refs.clasificacion} />
            )}

            <div>
                {mensaje}  
            </div>
            
            {tipoConsulta === 'normatividad' && (
                <div>
                    <Link href={`${props.config.endpointArchivos}${urlFicha}`} target="_blank">
                        Ver ficha
                    </Link>                
                </div>
            )}

            <SearchActionBar
            onSearch={consultar}
            onClear={limpiar}
            loading={loading}
            searchLabel="Buscar"
            helpText="Ingrese una condición de búsqueda válida para habilitar el botón de busqueda. Utilice los campos, valores y operadores para construir su consulta. Por ejemplo: CAMPO1 = 'Valor' AND CAMPO2 > 100."
            />
        </div>
    )
}
