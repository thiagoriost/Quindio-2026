// const servicioMadre = 'https: //pruebassig.igac.gov.co/server/rest/services/Indicadores/MapServer'
const mapServerNal = 'https://pruebassig.igac.gov.co/server/rest/services/Indicadores_nacionales_municipales/MapServer'
const mapServerDepartal = 'https://pruebassig.igac.gov.co/server/rest/services/Indicadores_departamentos/MapServer'
const MapServerMunicipal = 'https://pruebassig.igac.gov.co/server/rest/services/Indicadores_municipios/MapServer'

const urls = {
tablaContenido: 'https://sigquindio.gov.co:8443/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getTablaContenidoJsTree/public',
  // tablaContenido: 'http://172.17.3.205:8080/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getTablaContenidoJsTree/public',
  // tablaContenido: 'https://sae.igac.gov.co:8443/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getTablaContenidoJsTree/public', // REFORMA AGRARIA
  // tablaContenido: 'https://snra.igac.gov.co/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getTablaContenidoJsTree/public', // REFORMA AGRARIA
  // tablaContenido: 'https://sae.igac.gov.co:8444/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getTablaContenidoJsTree/public', // FIRMAS ESPECTRALES

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
    v_indice_gini_ids_depto: `${mapServerDepartal}/9`,


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

  }
}

export {
  urls
}
