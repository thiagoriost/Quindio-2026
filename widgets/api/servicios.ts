/**
 * Estandarización consumo servicios tipo REST
 * @date 2026-02-12
 * @author IGAC - DIP
 * @dateUpdated 2026-02-13
 * @changes Adaptación estándar consumo servicios, rama desarrollo Ing.CEF
 * @dateUpdated 2026-02-16
 * @changes Inclusión Servicios para consumo campo SubCategoria, basado en campo Categoria Widget Consulta Ambiental, objetos MapServerAmbientalAlfa + CategoLyr
 * @changes Inclusión método para procesar duplicados de objetos tipo Array
 * @changes Inclusión método para ordenamiento de municipios
 */

const protocolName    = "https";
const mapserverName   = "sigquindio.gov.co";
const resourceService = "arcgis/rest/services";
const MapServerMunicipalLst = protocolName + "://" + mapserverName + "/" + resourceService + "/" + "QUINDIO_III/CartografiaBasica/MapServer";
const MapServerAmbientalAlfa= protocolName + "://" + mapserverName + "/" + resourceService + "/" + "QUINDIO_III/AmbientalAlfanumerico/MapServer";
const CategoLyr = [8, 10];

const urls = {
      CARTOGRAFIA: {
        BASE: MapServerMunicipalLst,
        MUNICIPIOS: 75,
      },
      AMBIENTAL: {
        BASE: MapServerAmbientalAlfa,
        CATEGOR: CategoLyr
      }
}

 /**
     * sortMpios => Método para ordenamiento de municipios
     * @date 2026-02-12
     * @author IGAC - DIP
     * @param {object} obj 
     * @param {string} order 
     * @returns {object}
     * @reamrks campo nombre municipio NOMBRE
     * @remarks FUENTE consulta: Claude AI => https://claude.ai/chat/aa4f51f7-1b86-43ff-9524-8a646e5566bd
     * @remarks Tomado del proyecto SIEC (Firmas espectrales)
     * @remarks Colocar centralizado en utilidades (definir con Equipo trabajo)
     * @remarks Por ajustar en proyecto, con atributo nomMpio
     */
const sortMpios = function (obj, order = 'asc'){
  //Objetos locales
  const sortedObj = [...obj].sort ((a, b) => order === 'asc' ? a.nomMpio.localeCompare (b.nomMpio): b.nomMpio.localeCompare (a.nomMpio));
  return sortedObj; 
}

/**
 * sortSubCategor => Método para ordenamiento de sub categorías
 * @date 2026-02-16
 * @param obj 
 * @param order 
 * @returns {object}
 */
const sortSubCategor = function (obj, order = 'asc'){
  //Objetos locales
  const sortedObj = [...obj].sort ((a, b) => order === 'asc' ? a.subCategorTxt.localeCompare (b.subCategorTxt): b.subCategorTxt.localeCompare (a.subCategorTxt));
  return sortedObj; 
}

/**
     * Método procesaDuplic => Verifica unicidad de elementos en un array tipo JSON
     * @date 2026-02-16
     * @author IGAC - DIP
     * @param (Array) arrResult => Array con items duplicados
     * @param (String) opc => opción para filtrado.
     * @remarks Adicionar parametro opc, correspondiente al objeto que se filtra
     * @returns (Array) Array JSON sin items duplicados
     * @remarks método obtenido desde URL https://www.geeksforgeeks.org/how-to-remove-duplicates-in-json-array-javascript/
     * @remarks método obtenido desde proyecto SIEC (Firmas espectrales)
     */
    
const procesaDuplic = function (arrResult, opc){
  let newArrResult = [];
  switch (opc)
  {
    case 'subCategorTTramite':
    {
      newArrResult = arrResult.filter((obj, index, self) =>
        index === self.findIndex((t) => (
          t.attributes.TIPO_TRAMITE
          === obj.attributes.TIPO_TRAMITE
        )));
      return newArrResult;           
    }
    case 'subCategorTDescVal':{
      newArrResult = arrResult.filter((obj, index, self) =>
        index === self.findIndex((t) => (
          t.attributes.DESCRIPCIONVALOR
          === obj.attributes.DESCRIPCIONVALOR
        )));
      return newArrResult;           
    }
    
    default:
    {
      newArrResult = arrResult.filter((obj, index, self) =>
        index === self.findIndex((t) => (
          t.objectid === obj.objectid && t.projectname === obj.projectname && t.campananame === obj.campananame
        )));
      return newArrResult; 
    }
  }
  
}
export {
    urls,
    sortMpios,
    sortSubCategor,
    procesaDuplic
};