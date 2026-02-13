import { ApiResponse } from '../models/api-response.model'
import { HttpService } from './http.service'

export class ArcgisService {

  private http = new HttpService()

  async queryLayer<T>(baseUrl: string, layerId: number, params: {
    where?: string
    outFields?: string
    returnGeometry?: boolean
  }): Promise<ApiResponse<T>> {

    const {
      where = '1=1',
      outFields = '*',
      returnGeometry = true
    } = params

    const url = `
      ${baseUrl}/${layerId}/query
      ?where=${encodeURIComponent(where)}
      &outFields=${outFields}
      &returnGeometry=${returnGeometry}
      &f=json
    `.replace(/\s/g, '')

    return this.http.get<T>(url)
  }
}
