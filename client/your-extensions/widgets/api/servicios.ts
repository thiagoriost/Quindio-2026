/**
 * @date 2025-04-22
 * @changes Adición URL acceso servicio de consulta proyecto firmas espectrales en objeto firmasEsp
 * @author IGAC - DIP
 * @dateUpdated 2025-06-25
 * @changes Adición URL acceso servicio de consulta proyectos firmas espectrales con información real en objeto firmasEspReal
 * @dateUpdated 2025-07-17
 * @changes Actualización URL acceso servicio de consulta "https://pruebassig.igac.gov.co/server/rest/services/FE_Puntos_Muestreo/MapServer/0" => "https://pruebassig.igac.gov.co/server/rest/services/FE_Puntos_de_Muestreo/MapServer/0"
 * @changes creación objeto API para generar token seguridad => api_host
 * @changes creación objeto API para obtener lista proyectos con campos de salida Id_Proyecto, ProjectName => api_getProybyFields
 * @dateUpdated 2025-07-18
 * @changes creación objeto API para obtener lista campañas => api_getCampa_as
 * @changes creación objeto API para obtener metadatos de la firma asociada al atributo phsig
 * @dateUpdated 2025-07-21
 * @changes creación objeto API para obtener firmas, según el identificador asociada al atributo ObjectId (object_id)
 * @dateUpdated 2025-07-22
 * @changes creación objeto API api_getFotoByIdFile, para obtener imagenes, según atributos Id_PhotoCover, Id_PhotoContext, Id_PhotoSky, IdSpectraGraph
 * @changes creación objeto API api_getMetaDatoIdMetaByPhSig, para obtener identificador de metadatos de la firma asociada
 * @changes creación objeto API api_getFileCompressByIdMeta, para obtener id del archivo comprimido
 * @changes creación objeto API api_getCompressByIdFile, para obtener archivo zip comprimido
 * @dateUpdated 2025-07-23
 * @changes creación objeto API api_getValDominioByIdVal, para obtener valor asociado del dominio
 * @dateUpdated 2025-07-29
 * @changes creación objeto API api_getProyectosByIdProy, para obtener información asociado al proyecto {nombre, descripción e institución}
 * @changes creación objeto API api_getInstrumentosByNomInstrum, para obtener información asociado al instrumento {Id_Instrumento, InstrumentManufacturer, InstrumentModel, MetrologicNumber, SpectralRange}
 * @dateUpdated 2025-07-30
 * @changes creación objeto API api_getFileNameByIdFile, para obtener el nombre de archivo conocido su identificador
 * @changes en asocio al objeto API api_getFileNameByIdFileFlds, para visualizar el campo nombreArchivo para descarga (filename_download)
 * @dateUpdated 2025-08-04
 * @changes Actualización objeto api_host 172.19.3.245 => dev-catalogofirmas.igac.gov.co
 * @dateUpdated 2025-08-06
 * @changes Adición URL acceso servicio de consulta tipos de cobertura (tipo_cobertura), objeto firmasEspTCober
 **/
// const servicioMadre = 'https: //pruebassig.igac.gov.co/server/rest/services/Indicadores/MapServer'
const mapServerNal = 'https://pruebassig.igac.gov.co/server/rest/services/Indicadores_nacionales_municipales/MapServer'
const mapServerDepartal = 'https://pruebassig.igac.gov.co/server/rest/services/Indicadores_departamentos/MapServer'
const MapServerMunicipal = 'https://pruebassig.igac.gov.co/server/rest/services/Indicadores_municipios/MapServer'

const urls = {
  // tablaContenido: 'https://sigquindio.gov.co:8443/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getTablaContenidoJsTree/public',
  // tablaContenido: 'http://172.17.3.205:8080/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getTablaContenidoJsTree/public',
  // tablaContenido: 'https://sae.igac.gov.co:8443/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getTablaContenidoJsTree/public', // REFORMA AGRARIA
  // tablaContenido: 'localhost:8080/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getTablaContenidoJsTree/public', // REFORMA AGRARIA
  // tablaContenido: 'http://localhost:8080/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getTablaContenidoJsTree/public', // REFORMA AGRARIA
  // tablaContenido: 'https://sigquindio.gov.co:8443/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getTablaContenidoJsTree/public',
  // tablaContenido: 'http://172.17.3.205:8080/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getTablaContenidoJsTree/public',
  // tablaContenido: 'https://sae.igac.gov.co:8443/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getTablaContenidoJsTree/public', // REFORMA AGRARIA
  // tablaContenido: 'localhost:8080/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getTablaContenidoJsTree/public', // REFORMA AGRARIA
  // tablaContenido: 'http://localhost:8080/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getTablaContenidoJsTree/public', // REFORMA AGRARIA
  tablaContenido: 'https://snra.igac.gov.co/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getTablaContenidoJsTree/public', // REFORMA AGRARIA
  // tablaContenido: '/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getTablaContenidoJsTree/public', // REFORMA AGRARIA docker
  // tablaContenido: 'https://sae.igac.gov.co:8444/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getTablaContenidoJsTree/public', // FIRMAS ESPECTRALES
  firmasEsp: "https://pruebassig.igac.gov.co/server/rest/services/FE_Edicion/MapServer/0",
  /*  firmasEspDptos: mapServerNal+"/1",
   firmasEspMpios: mapServerNal+"/0", */
  firmasEspReal: "https://pruebassig.igac.gov.co/server/rest/services/FE_Puntos_de_Muestreo/MapServer/0",
  firmasEspTCober: "https://pruebassig.igac.gov.co/server/rest/services/Vista_Puntos_Cobertura/MapServer/0",
  api_host: "https://dev-catalogofirmas.igac.gov.co",
  api_getToken: "/auth/login",
  api_getProybyFields: "/items/Proyectos" + "?fields=Id_Proyecto,ProjectName",
  api_getCampa_as: "/items/Campanas" + "?fields=*",
  api_getMetaDatoByPhSig: "/items/Metadatos_Firmas" + "?filter[FileIdentifier][_eq]=",
  api_getMetaDatoIdMetaByPhSig: "/items/Metadatos_Firmas" + "?fields=Id_Metadato&filter[FileIdentifier][_eq]=",
  api_getFirmasByObjectId: "/items/Firmas_Espectrales" + "?filter[ObjectId][_eq]=",
  api_getFotoByIdFile: "/assets/",
  api_getFileCompressByIdMeta: "/items/Metadatos_Firmas_files" + "?filter[Metadatos_Firmas_Id_Metadato][_eq]=",
  api_getCompressByIdFile: "/assets/",
  api_getValDominioByIdVal: "/items/Valores_Dominio" + "?fields=Descripcion_Valor&filter[Id_Valor_Dominio][_eq]=",
  api_getProyectosByIdProy: "/items/Proyectos" + "?fields=Id_Proyecto,ProjectName,ProjectDescription,ProjectInstitution" + "&filter[Id_Proyecto][_eq]=",
  api_getInstrumentosByNomInstrum: "/items/Instrumentos" + "?filter[InstrumentName][_eq]=",
  api_getFileNameByIdFile: "/files/",
  api_getFileNameByIdFileFlds: "?fields=filename_download",
  Municipios: `${MapServerMunicipal}/0`,
  Departamentos: `${MapServerMunicipal}/1`,

  indicadores: { // municipales  Indicadores_municipios (MapServer)
    v_predios_campesinos_orip_mun: `${MapServerMunicipal}/3`,
    v_predios_campesinos_adj_mun: `${MapServerMunicipal}/4`,
    v_predios_sub_integrales_mun: `${MapServerMunicipal}/5`,
    v_predios_campesinos_tit_mun: `${MapServerMunicipal}/6`,
    v_predios_titulados_muj_mun: `${MapServerMunicipal}/7`,
    v_predios_restierras_mun: `${MapServerMunicipal}/8`,
    v_indice_gini_ids_mun: `${MapServerMunicipal}/9`,
    v_predios_uaf_mun: `${MapServerMunicipal}/10`,
    v_predios_conflicto_mun: `${MapServerMunicipal}/11`,
    v_predios_ley2da_mun: `${MapServerMunicipal}/12`,
    v_predios_etnicos_por_mun: `${MapServerMunicipal}/13`,
    v_predios_etnicos_mun: `${MapServerMunicipal}/14`,
    v_predios_zrc_mun: `${MapServerMunicipal}/15`

  },
  indicadoresNaci: { // nacionales Indicadores_nacionales_municipales
    v_predios_campesinos_orip_mun: `${MapServerMunicipal}/3`,
    v_predios_campesinos_adj_mun: `${MapServerMunicipal}/4`,
    v_predios_sub_integrales_mun: `${MapServerMunicipal}/5`,
    v_predios_campesinos_tit_mun: `${MapServerMunicipal}/6`,
    v_predios_titulados_muj_mun: `${MapServerMunicipal}/7`,
    v_predios_restierras_mun: `${MapServerMunicipal}/8`,
    v_indice_gini_ids_mun: `${MapServerMunicipal}/9`,
    v_predios_uaf_mun: `${MapServerMunicipal}/10`,
    v_predios_conflicto_nacmun: `${mapServerNal}/10`,
    v_predios_conflicto_mun: `${MapServerMunicipal}/11`,
    v_predios_etnicos_por_nacmun: `${mapServerNal}/11`,
    v_predios_ley2da_mun: `${MapServerMunicipal}/12`,
    v_predios_etnicos_nacmun: `${mapServerNal}/12`,
    v_predios_etnicos_por_mun: `${MapServerMunicipal}/13`,
    v_predios_etnicos_mun: `${MapServerMunicipal}/14`,
    v_indice_gini_ids_nac_tot: `${mapServerNal}/17`,
    v_predios_ley2da_nacmun: `${mapServerNal}/18`,
    v_predios_zrc_nacmun: `${mapServerNal}/19`,
    v_predios_actualizados_depto: `${mapServerDepartal}/15`,
    v_municipios_actualizados_depto: `${mapServerDepartal}/16`,
    v_predios_zrc_mun: `${MapServerMunicipal}/15`,
    v_indice_gini_ids_depto: `${mapServerDepartal}/9`

  },
  /* indicadoresNaci: { // nacionales Indicadores_nacionales_municipales
    v_predios_campesinos_orip_nacmun: `${mapServerNal}/3`,
    v_predios_campesinos_adj_nacmun: `${mapServerNal}/4`,
    v_predios_sub_integrales_nacmun: `${mapServerNal}/5`,
    v_predios_campesinos_tit_nacmun: `${mapServerNal}/6`,
    v_predios_titulados_muj_nacmun: `${mapServerNal}/7`,
    v_predios_restierras_nacmun: `${mapServerNal}/8`,
    v_predios_uaf_nacmun: `${mapServerNal}/9`,
    v_predios_etnicos_por_nacmun: `${mapServerNal}/11`,
    v_predios_etnicos_nacmun: `${mapServerNal}/12`,
    v_predios_etnicos_porcnac: `${mapServerNal}/13`,
    v_predios_uaf_porcnac: `${mapServerNal}/14`,
    v_predios_zrc_porcnac: `${mapServerNal}/15`,
    v_predios_ley2da_porcnac: `${mapServerNal}/16`,
  }, */
  indicadoresDepartal: { // Departamentales Indicadores_departamentos
    v_predios_campesinos_orip_mun: `${MapServerMunicipal}/3`,
    v_predios_campesinos_adj_mun: `${MapServerMunicipal}/4`,
    v_predios_sub_integrales_mun: `${MapServerMunicipal}/5`,
    v_predios_campesinos_tit_mun: `${MapServerMunicipal}/6`,
    v_predios_titulados_muj_mun: `${MapServerMunicipal}/7`,
    v_predios_restierras_mun: `${MapServerMunicipal}/8`,
    v_indice_gini_ids_mun: `${MapServerMunicipal}/9`,
    v_predios_uaf_mun: `${MapServerMunicipal}/10`,
    v_predios_conflicto_nacmun: `${mapServerNal}/10`,
    v_predios_conflicto_mun: `${MapServerMunicipal}/11`,
    v_predios_etnicos_por_nacmun: `${mapServerNal}/11`,
    v_predios_ley2da_mun: `${MapServerMunicipal}/12`,
    v_predios_etnicos_nacmun: `${mapServerNal}/12`,
    v_predios_etnicos_por_mun: `${MapServerMunicipal}/13`,
    v_predios_etnicos_mun: `${MapServerMunicipal}/14`,
    v_predios_zrc_mun: `${MapServerMunicipal}/15`,
    v_indice_gini_ids_nac_tot: `${mapServerNal}/17`,
    v_predios_ley2da_nacmun: `${mapServerNal}/18`,
    v_predios_zrc_nacmun: `${mapServerNal}/19`,
    v_predios_campesinos_adj_depto: `${mapServerDepartal}/4`,
    v_predios_sub_integrales_dpto: `${mapServerDepartal}/5`,
    v_predios_campesinos_tit_depto: `${mapServerDepartal}/6`,
    v_predios_titulados_muj_depto: `${mapServerDepartal}/7`,
    v_predios_restierras_depto: `${mapServerDepartal}/8`,
    v_indice_gini_ids_depto: `${mapServerDepartal}/9`,
    v_predios_uaf_depto: `${mapServerDepartal}/10`,
    v_predios_conflicto_depto: `${mapServerDepartal}/11`,
    v_predios_etnicos_por_depto: `${mapServerDepartal}/12`,
    v_predios_etnicos_depto: `${mapServerDepartal}/13`,
    v_predios_etnicos_porcdepto: `${mapServerDepartal}/18`,
    v_predios_uaf_porcdepto: `${mapServerDepartal}/19`,
    v_predios_zrc_porcdepto: `${mapServerDepartal}/20`,
    v_predios_zrc_depto: `${mapServerDepartal}/14`,
    v_predios_actualizados_depto: `${mapServerDepartal}/15`,
    v_municipios_actualizados_depto: `${mapServerDepartal}/16`,
    v_predios_ley2da_depto: `${mapServerDepartal}/17`

  },
  indicadoresNaciAlfanumerica: { // nacionales para graficas estadisticas
    v_predios_fondo_tierras_sumnac: `${mapServerNal}/19`,
    v_predios_inv_baldios_sumnac: `${mapServerNal}/20`,
    v_predios_adjudicados_sumnac: `${mapServerNal}/21`,
    v_predios_formalizados_sum: `${mapServerNal}/22`,
    v_predios_for_mujeres_sumnac: `${mapServerNal}/23`,
    v_predios_adj_baldios_sumnac: `${mapServerNal}/24`,
    v_bienes_fiscales_adj_sumnac: `${mapServerNal}/25`,
    v_predios_sub_integrales_sumnac: `${mapServerNal}/26`,
    v_predios_entregados_ft_sumnac: `${mapServerNal}/27`,
    v_predios_uaf_sumnac: `${mapServerNal}/28`,
    v_predios_restierras_sumnac: `${mapServerNal}/29`,
    v_predios_zrc_avgnac: `${mapServerNal}/30`,
    v_predios_ley2da_avgnac: `${mapServerNal}/31`,
    v_predios_etnicos_porcnac: `${mapServerNal}/32`,
    v_predios_uaf_porcnac: `${mapServerNal}/33`,
    v_predios_zrc_porcnac: `${mapServerNal}/34`,
    v_predios_ley2da_porcnac: `${mapServerNal}/35`,
    v_indice_gini_ids_nacmun: `${mapServerNal}/15`
  },

  CARTOGRAFIA: {
    BASE: 'https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/CartografiaBasica/MapServer',
    MUNICIPIOS: 75,
  },

}

export {
  urls
}