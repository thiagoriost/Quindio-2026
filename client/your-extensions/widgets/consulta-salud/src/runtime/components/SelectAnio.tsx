/** @jsx jsx */
import { jsx } from 'jimu-core'
import { Select, Label, Option } from 'jimu-ui'
import SelectDesdeArray from './SelectDesdeArray'
import { arrayValueLabel, handleError, queryCapa } from '../util';

export default function SelectAnio({loading, anios, anio, setAnio}) {
    return (
        <SelectDesdeArray
        label="Año"
        disabled={loading}
        array={anios}
        valor={anio}
        setValor={setAnio} />
    )
}

export async function cargarAniosDesdeREST(setAnios, execute, arcgisService, url, idCapa, setMessage) {
    setAnios([]);

    const response = await queryCapa(execute, arcgisService, url, idCapa, 
        {
            f: 'json',
            where: '1=1',
            returnGeometry: false,
            outFields: "ANIO",
            returnDistinctValues: true,
            orderByFields: `ANIO DESC`
        }
    );

    if (handleError(response, setMessage) === -1)
        return;
    
    const features = response.data?.features ?? []    
    setAnios( arrayValueLabel(features, "ANIO", "ANIO") )            
}