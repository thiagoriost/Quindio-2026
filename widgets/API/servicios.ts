/**
 * Estandarización consumo servicios tipo REST
 * @date 2026-02-12
 * @author IGAC - DIP
 */

const protocolName    = "https";
const mapserverName   = "sigquindio.gov.co";
const resourceService = "arcgis/rest/services";
const MapServerMunicipalLst = protocolName + "://" + mapserverName + "/" + resourceService + "/" + "QUINDIO_III/CartografiaBasica/MapServer/75";

const urls = {
    Municipios: `${MapServerMunicipalLst}`
}

export {
    urls
};