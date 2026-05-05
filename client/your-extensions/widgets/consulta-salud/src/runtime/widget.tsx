/** @jsx jsx */
import { React, jsx, AllWidgetProps } from 'jimu-core'

// @ts-ignore
import '../styles/styles.scss'
const { useEffect, useState, useRef } = React

import { urls } from '../../../api/serviciosQuindio'
import { WIDGET_IDS } from '../../../shared/constants/widget-ids'
import { ArcgisService } from '../../../shared/services/arcgis.service'
import { HttpService } from '../../../shared/services/http.service'
import { useCancelableHttp } from '../../../shared/hooks/useCancelableHttp'
import stethoscopeIcon from '../assets/stethoscope-solid-full.svg'
import starIcon from '../assets/star-solid-full.svg'

import {
    abrirTablaResultados,
    limpiarYCerrarWidgetResultados
} from '../../../widget-result/src/runtime/widget'
import { listarCapas, queryCapa } from './util'

import ConsultaGeneral  from './components/ConsultaGeneral'
import ConsultaIndicadores from './components/ConsultaIndicadores'
import ConsultaTematicas from './components/ConsultaTematicas'
import { SearchActionBar } from '../../../shared/components/search-action-bar'

import type { IMConfig } from '../config'
import type { ConsultaComponentHandle } from './consulta-general-types'
import type {
    ArcGisFeature,
    ArcGisField,
    SelectOption,
} from './types'
import { listaMunicipios } from './components/SelectMunicipio'
import SelectDesdeArray from './components/SelectDesdeArray'
import DetalleLabelValueFoto from './components/DetalleLabelValueFoto'
import { ResultTable } from '../../../shared/components/ResultTable'
import PanelInformativo, { itemsInformacionContacto } from '../../../shared/components/PanelInformativo/PanelInformativo'

const arcgisService = new ArcgisService()
const httpService = new HttpService();

const Widget = (props: AllWidgetProps<IMConfig>) => {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('');
    const [mostrarBusqueda, setMostrarBusqueda] = useState(true);
    
    const { execute, cancelAll } = useCancelableHttp();
    const cancelAllRef = useRef(cancelAll);
    const widgetResultId = WIDGET_IDS.RESULT

    const [tipoConsulta, setTipoConsulta] = useState('general')    
    const [municipios, setMunicipios] = useState<SelectOption[]>([])
    const [idMunicipio, setIdMunicipio] = useState<string>('')
    
    const refs = {
        general: useRef<ConsultaComponentHandle>(null), 
        indicadores: useRef<ConsultaComponentHandle>(null),
        tematicas: useRef<ConsultaComponentHandle>(null)
    };

    const refDatos = useRef({});

    useEffect(() => {
        const cargarMunicipios = async () => {
            setLoading(true)
            const lista = await listaMunicipios(execute, arcgisService) ?? []
            setLoading(false);
            setMunicipios(lista);
            setIdMunicipio((current) => current || lista?.[0]?.value || '')
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
    }, [cancelAll])

    const onClose = () => {
        cancelAll();
        limpiarYCerrarWidgetResultados(widgetResultId);
    }

    const consultar = async ()=> {        
        const result = await refs[tipoConsulta].current.consultar();

        abrirTablaResultados(
            result.features,
            result.fields,
            props,
            widgetResultId,
            result.spatialReference,
            result.withGraphic
        )
        
        if (tipoConsulta === 'general') {
            setMostrarBusqueda(false);
            refDatos.current = {...result};
        }
    }

    const limpiar = () => {
        refs[tipoConsulta].current.limpiar()
    }

    //useOnWidgetClose(props.id, onClose)

    const tiposConsulta = [
        { value: 'general', label: 'General' },
        { value: 'indicadores', label: 'Indicadores' },
        { value: 'tematicas', label: 'Temáticas' }
    ];    

    const capacidadesItems = Array.isArray(refDatos.current.cgCapacidades)
    ? refDatos.current.cgCapacidades.map((item) => ({
        label: item.attributes.TIPO_CAPACIDAD,
        value: item.attributes.VALORCAPACIDAD
        }))
    : [];
    
    const serviciosItems = Array.isArray(refDatos.current.cgServicios)
    ? refDatos.current.cgServicios.map((item) => ({
        value: item.attributes.TIPO_SERVICIO
        })).sort((a: any, b: any) => a.value.localeCompare(b.value))
    : [];

    return (
        mostrarBusqueda ? (
            <FormularioDeBusqueda
            tiposConsulta={tiposConsulta}
            tipoConsulta={tipoConsulta}
            setTipoConsulta={setTipoConsulta}
            refs={refs}
            loading={loading}
            setLoading={setLoading}
            execute={execute}
            props={props}
            idMunicipio={idMunicipio}
            setIdMunicipio={setIdMunicipio}
            municipios={municipios}
            message={message}
            setMessage={setMessage}
            consultar={consultar}
            limpiar={limpiar}/>
        ) : (
            <div className="consulta-salud">                
                <PanelInformativo
                imagenUrl={refs.general.current?.getFeatures()?.[0]?.attributes?.['FOTOS']
                    ? `${urls.URL_ARCHIVOS_QUINDIO}${refs.general.current.getFeatures()[0].attributes['FOTOS']}`
                    : ''
                }
                titulo={ refs.general.current?.getFeatures()?.[0]?.attributes["NOMBREEQUIPAMIENTO"]}
                listaIconoTextoItems={
                     /*
                     [ {iconoSrc: starIcon, iconoAlt:"Estrella", texto:"Item importante", valor:refs.general.current?.getFeatures()?.[0]?.attributes["HORARIOS"]}]    
                    */
                    itemsInformacionContacto({
                        horario: refs.general.current?.getFeatures()?.[0]?.attributes["HORARIOS"],
                        direccion: refs.general.current?.getFeatures()?.[0]?.attributes["DIRECCION"],
                        telefono: refs.general.current?.getFeatures()?.[0]?.attributes["TELEFONO"],
                        sitioWeb: refs.general.current?.getFeatures()?.[0]?.attributes["SITIOWEB"],
                        email: refs.general.current?.getFeatures()?.[0]?.attributes["EMAIL"]
                    })
                }
                chipsIconoTextoTitulo={"capacidades"}
                chipsIconoTextoItems={capacidadesItems}
                chipsIconoTextoIcono={stethoscopeIcon}                              
                chipsTextoTitulo={"servicios"}
                chipsTextoItems={serviciosItems}              
                botonOnClick={() => setMostrarBusqueda(true)} />
            </div>
        )
    )
}

function FormularioDeBusqueda({tiposConsulta, tipoConsulta, setTipoConsulta, refs, loading, setLoading, execute, props, idMunicipio, setIdMunicipio, 
    municipios, message, setMessage, consultar, limpiar}: any) {
    return (
    <div className="consulta-salud" >
            <SelectDesdeArray label={"Consulta por"} valor={tipoConsulta} setValor={setTipoConsulta} 
            array={tiposConsulta} disabled={loading}  />

            {tipoConsulta === 'general' && (
                <ConsultaGeneral
                arcgisService={arcgisService}
                httpService={httpService}
                ref={refs.general}
                loading={loading}
                setLoading={setLoading}
                execute={execute}
                url={props.config.urlSalud}
                urlAlfanumerico={props.config.urlSaludAlfanumerico}
                idMunicipio={idMunicipio}
                setIdMunicipio={setIdMunicipio}
                municipios={municipios}
                message={message}
                setMessage={setMessage} />
            )}

            {tipoConsulta === 'indicadores' && (           
                <ConsultaIndicadores            
                arcgisService={arcgisService}
                httpService={httpService}
                ref={refs.indicadores}
                loading={loading}
                execute={execute}
                url={props.config.urlSaludAlfanumerico}
                setMessage={setMessage} />
            )}

            {tipoConsulta === 'tematicas' && (
                <ConsultaTematicas
                arcgisService={arcgisService}
                httpService={httpService}
                ref={refs.tematicas}
                loading={loading}
                idMunicipio={idMunicipio}
                setIdMunicipio={setIdMunicipio}
                municipios={municipios}
                execute={execute}
                url={props.config.urlSaludAlfanumerico}
                setMessage={setMessage} />
            )}

            <SearchActionBar
            onSearch={consultar}
            onClear={limpiar}
            loading={loading}
            searchLabel="Buscar"
            helpText="Ingrese una condición de búsqueda válida para habilitar el botón de busqueda. Utilice los campos, valores y operadores para construir su consulta. Por ejemplo: CAMPO1 = 'Valor' AND CAMPO2 > 100."
            />

            <div>
                {message}  
            </div>
        </div>
    )
}

export default Widget
