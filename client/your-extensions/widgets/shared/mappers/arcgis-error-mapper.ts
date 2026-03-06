export interface ArcGisError {
    code?: number
    message?: string
    details?: string[]
}

/**
 * Mapper encargado de transformar errores técnicos
 * en mensajes entendibles para el usuario.
 *
 * NO depende de componentes UI.
 */

export class ArcGisErrorMapper {

    static map(error: ArcGisError): string {

        const code = error?.code
        const message = error?.message ?? ''

        // Prioridad 1: código de error
        switch (code) {

            case 400:
                return 'Solicitud inválida al servicio cartográfico.'

            case 401:
                return 'No autorizado para acceder al servicio.'

            case 403:
                return 'No tiene permisos para acceder a este recurso.'

            case 404:
                return 'El servicio cartográfico no fue encontrado.'

            case 498:
                return 'La sesión ha expirado. Por favor inicie sesión nuevamente.'

            case 499:
                return 'Se requiere autenticación para acceder al servicio.'

            case 500:
                return 'Servicio cartográfico no econtrado.'

            case 523:
                return 'No se puede conectar con ArcGIS Server.'

            case 524:
                return 'ArcGIS Server tarda demasiado en responder.'
        }

        // Prioridad 2: analizar texto del mensaje

        if (message.includes('not found')) {
            return 'El servicio cartográfico no está disponible.'
        }

        if (message.includes('Invalid URL')) {
            return 'La URL del servicio no es válida.'
        }

        if (message.includes('Token Required')) {
            return 'Se requiere autenticación para consultar este servicio.'
        }

        if (message.includes('Unable to complete operation')) {
            return 'No fue posible completar la operación en el servidor cartográfico.'
        }

        // Fallback seguro
        return 'Ocurrió un error en el servicio cartográfico.'
    }
}
