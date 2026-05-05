/** @jsx jsx */
import { React, jsx } from 'jimu-core'
import { Select, Label, Option } from 'jimu-ui'
const { useEffect,useState, useImperativeHandle, forwardRef, useRef } = React

import type { ConsultaComponentHandle, ConsultaGeneralProps } from '../consulta-general-types'
import type { ArcGisFeature, ArcGisField, SelectOption } from '../types'
import { arrayValueLabel, cargarDesdeArcgisService, handleError, listarCapas, queryCapa } from '../util'
import SelectMunicipio from './SelectMunicipio'
import SelectDesdeArray from './SelectDesdeArray'

const ConsultaGeneral = forwardRef(({
    loading,
    setLoading,
    execute,
    url,
    urlAlfanumerico,
    idMunicipio,
    setIdMunicipio,
    municipios,
    setMessage,
    arcgisService,
    httpService
}, ref) => {
    const [tipoEstablecimientos, setTipoEstablecimientos] = useState<SelectOption[]>([])
    const [idTipoEstablecimiento, setIdTipoEstablecimiento] = useState('')
    const [instituciones, setInstituciones] = useState<SelectOption[]>([])
    const [idInstitucion, setIdInstitucion] = useState<string>('');
    const [nombreInstitucion, setNombreInstitucion] = useState<string>('');

    const resultadosRef = useRef<{
        features: ArcGisFeature[]
        fields: ArcGisField[]
        spatialReference?: __esri.SpatialReference
    }>({
        features: [],
        fields: [],
        spatialReference: undefined
    })

    const getFeatures = () => (
        idInstitucion
            ? resultadosRef.current.features.filter((feature) => String(feature.attributes?.OBJECTID ?? '') === idInstitucion)
            : resultadosRef.current.features
    )

    useImperativeHandle(ref, () => ({
        consultar: async () => {           
            const features = getFeatures();

            // Capacidades de la institucion 
            const capacidades = (await cargarDesdeArcgisService(execute, arcgisService, urlAlfanumerico, 2, {
                where: `NOMBREEQUIPAMIENTO='${nombreInstitucion}'`,
                outFields: '*',
                returnGeometry: false,
            }, setLoading)).features;

            // Servicios de la institucion 
            const servicios = (await cargarDesdeArcgisService(execute, arcgisService, urlAlfanumerico, 0, {
                where: `NOMBREEQUIPAMIENTO='${nombreInstitucion}'`,
                outFields: '*',
                returnGeometry: false,
            }, setLoading)).features;

            return {
                features,
                fields: resultadosRef.current.fields,
                spatialReference: resultadosRef.current.spatialReference,
                cgCapacidades: capacidades,
                cgServicios: servicios                
            }
        },
        getFeatures: () => getFeatures(),
        limpiar: () => {
            setIdTipoEstablecimiento(tipoEstablecimientos[0]?.value || '')
            setIdInstitucion(instituciones[0]?.value || '')
            setNombreInstitucion(instituciones[0]?.label || '')
            setIdMunicipio(municipios[0]?.value || '')
        }
    }), [idInstitucion, nombreInstitucion, tipoEstablecimientos, instituciones, municipios]);

    useEffect(() => {
        const initConsultaGeneral = async () => {
            await cargarTiposEstablecimiento(execute, httpService, url, setTipoEstablecimientos)
        }

        void initConsultaGeneral()
    }, []);

    useEffect(() => {
        if (!idTipoEstablecimiento && tipoEstablecimientos.length > 0) {
            setIdTipoEstablecimiento(tipoEstablecimientos[0].value)
        }
    }, [idTipoEstablecimiento, tipoEstablecimientos]);

    useEffect(() => {
        const cargarInstituciones = async () => {
            if (!idMunicipio || !idTipoEstablecimiento) {
                resultadosRef.current = {
                    features: [],
                    fields: [],
                    spatialReference: undefined
                }
                setInstituciones([])
                return
            }

            const resp = await cargarDesdeArcgisService(execute, arcgisService, url, parseInt(idTipoEstablecimiento, 10), {
                where: `IDMUNICIPIO="${idMunicipio}"`,
                outFields: '*',
                returnGeometry: true
            }, setLoading)

            resultadosRef.current = {...resp}            

            const opcionesInstituciones = arrayValueLabel(resp.features, 'OBJECTID', 'NOMBREEQUIPAMIENTO')
            setInstituciones(opcionesInstituciones);
            setIdInstitucion(opcionesInstituciones[0]?.value || '');
            setNombreInstitucion(opcionesInstituciones[0]?.label || '');
        }

        void cargarInstituciones()
    }, [idMunicipio, idTipoEstablecimiento]);

    return (
        <>       
            <SelectDesdeArray label={'Categoría'} valor={idTipoEstablecimiento} 
            onChange={(e) => {                
                setIdTipoEstablecimiento(e.target.value)
                setIdInstitucion('')
            }}
            array={tipoEstablecimientos} disabled={loading} />

            <SelectMunicipio loading={loading} municipios={municipios} idMunicipio={idMunicipio} setIdMunicipio={setIdMunicipio} />
                    
            <SelectDesdeArray label={'Institución'} valor={idInstitucion} 
            onChange={(e) => {
                const selected = instituciones.find(option => option.value === e.target.value)
                setIdInstitucion(e.target.value)
                setNombreInstitucion(selected?.label || '')
            }}
            array={instituciones} disabled={loading} />
        </>
    )
})

export default ConsultaGeneral

async function cargarTiposEstablecimiento(execute, httpService, url, setTipoEstablecimientos) {
    const response = await listarCapas(execute, httpService, url)
    const layers = response.data?.layers ?? []

    const opciones = layers.map((layer) => ({
        value: String(layer.id),
        label: String(layer.name)
    })).sort((a, b) => a.label.localeCompare(b.label))

    setTipoEstablecimientos(opciones)
}
