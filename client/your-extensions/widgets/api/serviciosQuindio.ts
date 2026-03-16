const urls = {

  SERVICIO_GEOMETRIA      : "https://sigquindio.gov.co/arcgis/rest/services/Utilities/Geometry/GeometryServer",
  //SERVICIO_GEOMETRIA      : "https://sigquindio.gov.co/arcgis/rest/services/Utilities/Geometry/GeometryServer",
  SERVICIO_SOCIOECONOMICO : "https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/Socioeconomico_T/MapServer",
  SERVICIO_AMBIENTAL  : "https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/Ambiental_T_Ajustado/MapServer",
  SERVICIO_AMBIENTAL_ALFANUMERICO : "https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/AmbientalAlfanumerico/MapServer",
  SERVICIO_CARTOGRAFIA_BASICA     : "https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/CartografiaBasica/MapServer",
  SERVICIO_EDUCACION              : "https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/Educacion_T/MapServer",
  SERVICIO_EDUCACION_ALFANUMERICO : "https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/EducacionAlfanumerico/MapServer",
  SERVICIO_SALUD                  : "https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/Salud_T/MapServer",
  SERVICIO_GENERAL_SALUD          : "https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/Salud_T/MapServer",
  SERVICIO_SALUD_ALFANUMERICO     : "https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/SaludAlfanumerico/MapServer",
  SERVICIO_CULTURA_TURISMO        : "https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/CulturaTurismo/MapServer",
  SERVICIO_CULTURA_TURISMO_ALFANUMERICO : "https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/TurismoAlfanumerico/MapServer/0",
  SERVICIO_ORDENAMIENTO_TERRITORIAL : "https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/OrdenamientoTerritorial_T/MapServer",
  SERVICIO_INDUSTRIA_COMERCIO     : "https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/Industria_Y_Comercio/MapServer",
  //SERVICIO_RIESGO :> SERVICIO_RIESGO_CONSULTA en ambiente productivo

  // ** Falla y se desconoce su uso (Octubre2019)
  //URL_ARCHIVOS_QUINDIO : "http://181.57.208.251/ArchivosQuindioII/",
  //URL_ARCHIVOS_QUINDIO : "http://181.57.208.251/ArchivosQuindioII/",
  URL_ARCHIVOS_QUINDIO : "https://sigquindio.gov.co/ArchivosQuindioIII/",
  SERVICIO_CONSULTA_AVANZADA_ALFANUMERICA : "https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/Consulta_Avanzada_Alfanumerica/MapServer",
  SERVICIO_RIESGO_CONSULTA : "https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/Riesgo/MapServer",
  SERVICIO_OTA_ALFANUMERICO   : "https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/OTAlfanumerico/MapServer",
  SERVICIO_CATASTRO_NUEVO     : "https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/Catastro_Nuevo1/MapServer",
  SERVICIO_TABLA_CONTENIDO_RIESGOS : "https://sigquindio.gov.co:8443/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getTablaContenidoJsTree/riesgos",
  SERVICIO_AGROPECUARIO       : "https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/AgropecuarioAlfanumerico/MapServer",
  SERVICIO_CUENCALAVIEJA      : "https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/CuencaLaVieja/MapServer",
  SERVICIO_TABLA_CONTENIDO    : "https://sigquindio.gov.co:8443/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getTablaContenidoJsTree/public",
  SERVICIO_PIA                : "https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/IndicadoresInfanciayAdolescencia/MapServer",
  SERVICIO_MDE                : "https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/MDE/ImageServer",
  //OJO: IP desconocida (IP Publica Pruebas en su momento)
  SERVICIO_MDS                : "http://132.255.20.184:6080/arcgis/rest/services/QUINDIO_III/hilshade/ImageServer",
  SERVICIO_BANCO_SERVICIOS    : "https://sigquindio.gov.co:8443/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getDirectorioWFS",
  SERVICIO_SHAPEFILE : "https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/ExportJsonToShape/GPServer/ExportJsonToShape/submitJob",
}
export {
  urls
}