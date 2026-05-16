/** @jsx jsx */
import { React, jsx } from 'jimu-core'
import { SelectOption } from '../../../../consulta-salud/src/runtime/types'
import { arrayValueLabel, cargarDesdeArcgisService } from '../../../../consulta-salud/src/runtime/util'
import SelectMunicipio from '../../../../consulta-salud/src/runtime/components/SelectMunicipio'
import SelectDesdeArray from '../../../../consulta-salud/src/runtime/components/SelectDesdeArray'
const {useState, useEffect, useImperativeHandle, forwardRef } = React

const ConsultaClasificacion = forwardRef(({url, execute, arcgisService, 
loading, setLoading, municipios, idMunicipio, setIdMunicipio}, ref) {
    const [clases, setClases] = useState<SelectOption[]>([])
    const [idClase, setIdClase] = useState<string>('')

    useImperativeHandle(ref, () => ({
        consultar: async () => {
            const condicionesWhere: string[] = [];
            if (idMunicipio)
                condicionesWhere.push(`IDMUNICIPIO=${idMunicipio}`)
            if (idClase)
                condicionesWhere.push(`VALORDOMINIO=${idClase}`)

            return cargarDesdeArcgisService(execute, arcgisService, url, 0, {
                where: condicionesWhere.length > 0 ? condicionesWhere.join(' AND ') : '1=1',
                outFields: '*',
                returnGeometry: true,
            }, setLoading);
        },
        limpiar: () => {
            setIdClase('');
            setIdMunicipio('');
        }
    }), [idClase, idMunicipio]);

    useEffect(() => {
        const cargarClases = async ()=> {
            if (!idMunicipio) {
                setClases([]);
                setIdClase('');
                return;
            }         

            const ret = await cargarDesdeArcgisService(execute, arcgisService, url, 0, {
                where: `IDMUNICIPIO=${idMunicipio}`,
                outFields: 'VALORDOMINIO,CLASE',
                returnGeometry:false,
                groupByFieldsForStatistics: 'VALORDOMINIO,CLASE',
                returnDistinctValues:true,
                orderByFields: `CLASE ASC`
            }, setLoading);

            setClases( arrayValueLabel(ret.features, 'VALORDOMINIO', 'CLASE') );
            setIdClase('');        
        }

        cargarClases();
    }, [idMunicipio]);

    return (
        <>
            <SelectMunicipio loading={loading} municipios={municipios} idMunicipio={idMunicipio} setIdMunicipio={setIdMunicipio} />
            <SelectDesdeArray label={'Clase'} valor={idClase} setValor={setIdClase} array={clases} disabled={loading} />
        </>
    )
})

export default ConsultaClasificacion;
