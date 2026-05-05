export async function listarCapas(execute, httpService, url) {
    const response = await execute((signal) =>
        httpService.get<{ layers?: Array<Record<string, unknown>> }>(
            `${url}?f=json`,
            true,
            signal
        )
    )

    return response;
}

export async function queryCapa(execute, arcgisService, baseUrl, layerId, params) {
    const response = await execute((signal) =>
        arcgisService.queryLayer<any>(
            baseUrl,
            layerId,
            params,
            true,
            signal
        )
    )
    
    return response;
}

export async function cargarDesdeArcgisService(execute, arcgisService, url, idCapa, propsQuery, setLoading=undefined) {
    if (setLoading)
        setLoading(true);
    
    try {
        const response = await queryCapa(execute, arcgisService, url, idCapa, propsQuery)
            if (handleError(response) === -1) {
            throw("Error accediendo a la capa");
        }
        
        return { ...response.data };
    } finally {
        if (setLoading)
            setLoading(false);
    }    
}


export function handleError(response, setMessage=null) {
    if (response.success) 
        return 0;
    
    if (setMessage) {
        setMessage(response.error ?? 'No fue posible consultar el servicio')
    }

    return -1    
}

export function arrayValueLabel(features, attrValue, attrLabel) {    
    return features.map((f: any) => { return({
        value: String(f.attributes[attrValue]),
        label: f.attributes[attrLabel]
    }))
    .sort((a: any, b: any) => a.label.localeCompare(b.label))
}