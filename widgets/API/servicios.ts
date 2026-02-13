/**
 * Estandarización consumo servicios tipo REST
 * @date 2026-02-12
 * @author IGAC - DIP
 * @dateUpdated 2026-02-13
 * @changes Adaptación estándar consumo servicios, rama desarrollo Ing.CEF
 */

const protocolName    = "https";
const mapserverName   = "sigquindio.gov.co";
const resourceService = "arcgis/rest/services";
const MapServerMunicipalLst = protocolName + "://" + mapserverName + "/" + resourceService + "/" + "QUINDIO_III/CartografiaBasica/MapServer";


const urls = {
      CARTOGRAFIA: {
        BASE: MapServerMunicipalLst,
        MUNICIPIOS: 75,
      },
}

export {
    urls
};