/** @jsx jsx */
import { React, jsx } from 'jimu-core'
import { Select, Label, Option } from 'jimu-ui'
import { ArcGisFeature, ArcGisField, SelectOption } from '../../../../consulta-salud/src/runtime/types'
import { arrayValueLabel, cargarDesdeArcgisService, queryCapa } from '../../../../consulta-salud/src/runtime/util'
import SelectMunicipio from '../../../../consulta-salud/src/runtime/components/SelectMunicipio'
import SelectDesdeArray from '../../../../consulta-salud/src/runtime/components/SelectDesdeArray'
const {useState, useEffect, useImperativeHandle, forwardRef, useRef } = React

const ConsultaEstrato = forwardRef(({url, execute, arcgisService, 
handleError, loading, setLoading, municipios, idMunicipio, setIdMunicipio}, ref) {
    const [estratos, setEstratos] = useState<SelectOption[]>([
        {label:"0", value:"0"},
        {label:"1", value:"1"},
        {label:"2", value:"2"},
        {label:"3", value:"3"},
        {label:"4", value:"4"},
        {label:"5", value:"5"},
        {label:"6", value:"6"},
    ]);

    const [idEstrato, setIdEstrato] = useState<string>('');

    const resultadosRef = useRef<{
        features: ArcGisFeature[]
        fields: ArcGisField[]
        spatialReference?: __esri.SpatialReference
    }>({
        features: [],
        fields: [],
        spatialReference: undefined
    });

    useImperativeHandle(ref, () => ({
        consultar: async () => {        
            const condicionesWhere: string[] = [];
            if (idMunicipio)
                condicionesWhere.push(`MUNICIPIO=${idMunicipio}`)
            if (idEstrato)
                condicionesWhere.push(`ESTRATO=${idEstrato}`)

            return cargarDesdeArcgisService(execute, arcgisService, url, 1, {
                where: condicionesWhere.length > 0 ? condicionesWhere.join(' AND ') : '1=1',
                outFields: '*',
                returnGeometry: true,
            }, setLoading);         
        },
        
        limpiar: () => {
            setIdEstrato('');
            setIdMunicipio('');
        }
    }), [idEstrato]);
    
    return (
        <>            
            <SelectMunicipio loading={loading} municipios={municipios} idMunicipio={idMunicipio} setIdMunicipio={setIdMunicipio} />
            <SelectDesdeArray label={'Estrato'} valor={idEstrato} setValor={setIdEstrato} array={estratos} disabled={loading} />
        </>
    )
})

export default ConsultaEstrato;