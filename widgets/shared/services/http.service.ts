import { ApiResponse } from '../models/api-response.model'

export class HttpService {

    async get<T>(url: string): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(url)

            if (!response.ok) {
                return { success: false, error: `HTTP ${response.status}` }
            }

            const json = await response.json()

            if (json.error) {
                return { success: false, error: json.error.message }
            }

            return { success: true, data: json }

        } catch (err) {
            return { success: false, error: 'Error de conexión al servidor' }
        }
    }
}
