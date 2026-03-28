export const cargarOpciones = async (url: string, params?: any) => {

  const query = new URLSearchParams(params).toString()

  const response = await fetch(`${url}?${query}`)

  return response.json()

}