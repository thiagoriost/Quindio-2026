import { urls } from '../../../api/serviciosQuindio'

export const obtenerLayerId = (subcategoria: string): number | null => {
    const capas: { [key: string]: number } = {
        metereologica: urls.Ambiental.Estaciones_climaticas,
        limnigrafica: urls.Ambiental.Estaciones_limnigraficas,
        calidadagua: urls.Ambiental.Monitoreo_calidad_agua,
        calidadaire: urls.Ambiental.Monitoreo_calidad_aire
    }

    return capas[subcategoria] ?? null
}

export const consultarCapasAmbientales = async (
    filters: any,
    deps: {
        realizarConsulta: Function;
        alertService: any;
        abrirTablaResultados: Function;
    }
) => {
    const { subcategoria, nombre, idMunicipio } = filters
    const urlBase = urls.Ambiental.BASE

    try {
        const layerId = obtenerLayerId(subcategoria)

        if (!layerId) {
            console.warn("Subcategoría no reconocida:", subcategoria)
            return
        }

        const where = `IDMUNICIPIO = '${idMunicipio}' AND NOMBRE = '${nombre?.toUpperCase()}'`

        const response = await deps.realizarConsulta(urlBase, layerId, where)

        if (!response || !response.success || !response.data) return

        const resultado = response.data

        if (!resultado.features || resultado.features.length === 0) {
            deps.alertService.warning(
                'Sin resultados',
                'No se encontraron resultados para los criterios seleccionados'
            )
            return
        }

        const fields = resultado.fields?.map((f: any) => ({
            name: f.name,
            alias: f.alias
        })) || []

        deps.abrirTablaResultados(
            false,
            resultado.features,
            fields,
            resultado.spatialReference as __esri.SpatialReference
        )

    } catch (error) {
        console.error("Error en consulta ambiental:", error)
    }
}

export const obtenerLayerIdPorSubcategoria = (subcategoria: string): number | null => {
    const capas: { [key: string]: number } = {
        // estaciones
        metereologica: urls.Ambiental.Estaciones_climaticas,
        limnigrafica: urls.Ambiental.Estaciones_limnigraficas,

        // calidad
        calidadagua: urls.Ambiental.Monitoreo_calidad_agua,
        calidadaire: urls.Ambiental.Monitoreo_calidad_aire
    }

    return capas[subcategoria] ?? null
}

export const obtenerOpcionesNombres = async (
    subcategoria: string,
    deps: {
        consultarMapServer: (
            url: string,
            layerId: number,
            outFields: string
        ) => Promise<any>;
    }
): Promise<
    Array<{
        label: string;
        value: string;
        idMunicipio: string;
    }>
> => {
    // Tipos internos
    interface NombreItem {
        nombre: string;
        idMunicipio: string;
    }

    const urlBase = urls.Ambiental.BASE
    const outFields = "NOMBRE, IDMUNICIPIO"

    // Configuración de capas
    const capas: { [key: string]: number } = {
        metereologica: urls.Ambiental.Estaciones_climaticas,
        limnigrafica: urls.Ambiental.Estaciones_limnigraficas,
        calidadagua: urls.Ambiental.Monitoreo_calidad_agua,
        calidadaire: urls.Ambiental.Monitoreo_calidad_aire
    }

    const layerId = capas[subcategoria]

    if (!layerId) {
        console.warn("Subcategoría no válida:", subcategoria)
        return []
    }

    try {
        const response = await deps.consultarMapServer(
            urlBase,
            layerId,
            outFields
        )

        const features = response?.data?.features || []

        // Transformación tipada
        const nombres: NombreItem[] = features
            .map((f: any) => ({
                nombre: f.attributes?.NOMBRE,
                idMunicipio: f.attributes?.IDMUNICIPIO
            }))
            .filter(
                (item: { nombre: any; idMunicipio: any }): item is NombreItem =>
                    !!item.nombre && !!item.idMunicipio
            )

        // Eliminar duplicados por nombre
        const nombresUnicos: NombreItem[] = Array.from(
            new Map<string, NombreItem>(
                nombres.map((item) => [item.nombre, item])
            ).values()
        )

        // Formato final
        return nombresUnicos.map((item) => ({
            label: item.nombre,
            value: item.nombre,
            idMunicipio: item.idMunicipio
        }))
    } catch (error) {
        console.error("Error obteniendo nombres:", error)
        return []
    }
}