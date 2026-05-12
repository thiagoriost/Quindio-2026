/** @jsx jsx */
import { jsx } from 'jimu-core'
import { Select, Label, Option } from 'jimu-ui'
import SelectDesdeArray from './SelectDesdeArray'
import { urls } from '../../../../api/serviciosQuindio';
import { queryCapa } from '../util';

export default function SelectMunicipio({loading, municipios, idMunicipio, setIdMunicipio}) {
    return (
        <SelectDesdeArray label={"Municipio"} disabled={loading} array={municipios} valor={idMunicipio} setValor={setIdMunicipio} />
    )   
}

export async function listaMunicipios(execute, arcgisService) {
    const response = await queryCapa(execute, arcgisService, urls.CARTOGRAFIA.BASE, urls.CARTOGRAFIA.MUNICIPIOS, {
        outFields: 'IDMUNICIPIO,NOMBRE',
        returnGeometry: false
    });

    if (!response.success) {
        return
    }

    const features = response.data?.features ?? []
    const lista = features
    .map((f: any) => ({
        value: String(f.attributes.IDMUNICIPIO),
        label: f.attributes.NOMBRE
    }))
    .sort((a: any, b: any) => a.label.localeCompare(b.label))

    return lista;
}
