/**
 * @dateUpdated 2025-10-15
 * @changes Adición indicadores 3.1.5, 3.1.6 y 3.1.7
 * @dateUpdated 2025-10-16
 * @changes Actualización atributo url indicadores 3.1.5, 3.1.6 y 3.1.7
 */
export const dataFuenteIndicadores = [
  {
    value: 1,
    label: '1. De adquisición, adjudicación de tierras y de procesos agrarios para la reforma agraria',
    descripcion: 'De adquisición, adjudicación de tierras y de procesos agrarios para la reforma agraria, y garantía de derechos territoriales de los campesinos, pueblos indígenas y de las comunidades negras, afrocolombianas, raizales, palenqueras y pueblo Rom',
    APUESTA_ESTRATEGICA: [ // o LINEA ESTRATEGICA
      /* {
        value: 1,
        label: '1.3 Adquisición de tierras ',
        descripcion: '',
        CATEGORIA_TEMATICA: [
          {
            value: 0,
            label: '',
            descripcion: '',
            INDICADOR: [
              {
                value: 0,
                // label: '1.1.1 Predios dispuestos en el Fondo de Tierras para la Reforma Agraria',
                label: '1.3.1 Predios ingresados al Fondo de Tierras',
                descripcion: '',
                fieldlabel: ['tipo_predio', 'anio'], // data a nivel municipal
                urlNal: '', // data a nivel nacional
                fieldValueDepartal: '', antidad_predio // data a nivel depatamentals',
                urlNalDataAlfanumerica: '', // para alguna data adicional alfanuemrica
                leyendaNal: ['Cantidad de Área por año (ha)', 'Tipos de predios'], // labels a nivel municipal
                fieldlabelNal: ['anio', 'tipo_predio'], // labels a nivel nacional
                fieldValueNal: 'total_area_ha', // labels a nivel departamental
                leyenda: ['Cantidad de área por tipo', 'Cantidad de Área por año (ha)'], // las leyendas para cada label // leyenda a nivel dapartamental
                fieldlabelDepartal: ['anio', 'tipo_predio'], // leyenda a nivel nacional
                url: '',
                fieldValue: 'total_area_ha',
                urlDepartal: 'v_predios_fondo_tierras_dpto',
                leyendaDepartal: ['Cantidad de Área por año (ha)', 'Tipos de predios'],
                quintiles: [
                  'porDefinir'
                ]
              },
              {
                value: 1,
                // label: '1.1.2 Área dispuesta en el Fondo de Tierras para la Reforma Agraria',
                label: '1.3.2 Área ingresada al Fondo de Tierras',
                descripcion: 'Cantidad de área ingresada en el Fondo de Tierras para la Reforma Agraria',
                fieldlabel: ['tipo_predio', 'anio'], // data a nivel municipal
                urlNal: '', // data a nivel nacional
                fieldValueDepartal: 'cantidad_predio // data a nivel depatamentals',
                urlNalDataAlfanumerica: 'v_predios_fondo_tierras_sumnac', // para alguna data adicional alfanuemrica
                leyendaNal: ['Cantidad de Área por año (ha)', 'Tipos de predios'], // labels a nivel municipal
                fieldlabelNal: ['anio', 'tipo_predio'], // labels a nivel nacional
                fieldValueNal: 'total_area_ha', // labels a nivel departamental
                leyenda: ['Cantidad de área por tipo', 'Cantidad de Área por año (ha)'], // las leyendas para cada label // leyenda a nivel dapartamental
                fieldlabelDepartal: ['anio', 'tipo_predio'], // leyenda a nivel nacional
                url: 'v_predios_fondo_tierras_mun',
                fieldValue: 'total_area_ha',
                urlDepartal: 'v_predios_fondo_tierras_dpto',
                leyendaDepartal: ['Cantidad de Área por año (ha)', 'Tipos de predios'],
                quintiles: [
                  'porDefinir'
                ]
              },
              {
                value: 2,
                label: '1.3.3 Predios ingresados al Fondo de Tierras mediante compra directa de tierras',
                descripcion: '',
                fieldlabel: [], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature // data a nivel municipal
                urlNal: '', //para data coropletica a nivel municipal // data a nivel nacional
                fieldValueDepartal: '', // estees el valor que tomara generar las cantidades p // data a nivel depatamentalara cada label
                urlNalDataAlfanumerica: '', //para data alfanumerica a nivel nacional // para alguna data adicional alfanuemrica
                leyendaNal: [], // las leyendas para cada label // labels a nivel municipal
                fieldlabelNal: [], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature // labels a nivel nacional
                fieldValueNal: '', // estees el valor que tomara generar las cantidades para cada label // labels a nivel departamental
                leyenda: [], // las leyendas para cada label // leyenda a nivel dapartamental
                fieldlabelDepartal: [], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature // leyenda a nivel nacional
                url: '', // trae info a nivel municipal
                fieldValue: '', // estees el valor que tomara generar las cantidades para cada label
                urlDepartal: '',
                leyendaDepartal: [],
                quintiles: [
                  'porDefinir'
                ]
              },
              {
                value: 3,
                label: '1.3.4 Área ingresada al Fondo de Tierras mediante compra directa de tierras',
                descripcion: '',
                fieldlabel: [], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature // data a nivel municipal
                urlNal: '', //para data coropletica a nivel municipal // data a nivel nacional
                fieldValueDepartal: '', // estees el valor que tomara generar las cantidades p // data a nivel depatamentalara cada label
                urlNalDataAlfanumerica: '', //para data alfanumerica a nivel nacional // para alguna data adicional alfanuemrica
                leyendaNal: [], // las leyendas para cada label // labels a nivel municipal
                fieldlabelNal: [], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature // labels a nivel nacional
                fieldValueNal: '', // estees el valor que tomara generar las cantidades para cada label // labels a nivel departamental
                leyenda: [], // las leyendas para cada label // leyenda a nivel dapartamental
                fieldlabelDepartal: [], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature // leyenda a nivel nacional
                url: '', // trae info a nivel municipal
                fieldValue: '', // estees el valor que tomara generar las cantidades para cada label
                urlDepartal: '',
                leyendaDepartal: [],
                quintiles: [
                  'porDefinir'
                ]
              }
            ]
          }
        ]
      }, */
      {
        value: 2,
        label: '1.5 Promover la adjudicación de tierras',
        descripcion: 'Promover la adjudicación de tierras.',
        CATEGORIA_TEMATICA: [
          {
            value: 0,
            label: '',
            descripcion: '',
            INDICADOR: [
              {
                value: 1,
                label: '1.5.1 Predios entregados a campesinos con registro en ORIP',
                descripcion: 'Predios entregados a campesinos con registro en ORIP',
                url: 'v_predios_campesinos_orip_mun', // trae info a nivel municipal
                urlNal: 'v_predios_campesinos_orip_mun', //para data coropletica a nivel municipal // data a nivel nacional
                urlDepartal: 'v_predios_campesinos_orip_mun', // data a nivel depatamental
                urlNalDataAlfanumerica: '', //para data alfanumerica a nivel nacional // para alguna data adicional alfanuemrica
                fieldlabel: ['anio', 'modo_entrega', 'genero_beneficiario'], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature // leyenda a nivel dapartamental
                fieldlabelNal: ['anio', 'modo_entrega', 'genero_beneficiario'], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature // labels a nivel departamental
                fieldlabelDepartal: ['anio', 'modo_entrega', 'genero_beneficiario'], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature
                leyenda: ['Número de predios por año', 'Modo entrega de predios', 'Número de predios por género del beneficiario'], // las leyendas para cada label
                leyendaNal: ['Número de predios por año', 'Modo entrega de predios', 'Número de predios por género del beneficiario'], // las leyendas para cada label // leyenda a nivel nacional
                leyendaDepartal: ['Número de predios por año', 'Modo entrega de predios', 'Número de predios por género del beneficiario'], // data a nivel municipal
                fieldValue: 'cantidad_predios', // estees el valor que tomara generar las cantidades para cada label
                fieldValueNal: 'cantidad_predios', // estees el valor que tomara generar las cantidades para cada label // labels a nivel municipal
                fieldValueDepartal: 'cantidad_predios', // estees el valor que tomara generar las cantidades para cada label
                quintiles: [
                  ['<=', 5,"Hasta 5 predios"],
                  [6, 10,"Entre 6 y 10 predios"],
                  [11, 20,"Entre 11 y 20 predios"],
                  [21, 50,"Entre 21 y 50 predios"],
                  [50, '>',"Más de 50 predios"]
                ]
              },
              {
                value: 2,
                label: '1.5.2 Área de predios entregados a campesinos con registro en ORIP',
                descripcion: 'Área de predios entregados a campesinos con registro en ORIP (ha)',
                url: 'v_predios_campesinos_orip_mun', // trae info a nivel municipal
                urlNal: 'v_predios_campesinos_orip_mun', //para data coropletica a nivel municipal // data a nivel nacional
                urlDepartal: 'v_predios_campesinos_orip_mun', // data a nivel depatamental
                urlNalDataAlfanumerica: '', //para data alfanumerica a nivel nacional // para alguna data adicional alfanuemrica
                fieldlabel: ['anio', 'modo_entrega', 'genero_beneficiario'], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature // leyenda a nivel dapartamental
                fieldlabelNal: ['anio', 'modo_entrega', 'genero_beneficiario'], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature // labels a nivel departamental
                fieldlabelDepartal: ['anio', 'modo_entrega', 'genero_beneficiario'], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature
                leyenda: ['Área por año (ha)', 'Modo entrega de Área (ha)', 'Género beneficiario del área (ha)'], // las leyendas para cada label
                leyendaNal: ['Área por año (ha)', 'Modo entrega de Área (ha)', 'Género beneficiario del área (ha)'], // las leyendas para cada label // leyenda a nivel nacional
                leyendaDepartal: ['Área por año (ha)', 'Modo entrega de Área (ha)', 'Género beneficiario del área (ha)'], // data a nivel municipal
                fieldValue: 'total_area_ha', // estees el valor que tomara generar las cantidades para cada label
                fieldValueNal: 'total_area_ha', // estees el valor que tomara generar las cantidades para cada label // labels a nivel municipal
                fieldValueDepartal: 'total_area_ha', // estees el valor que tomara generar las cantidades para cada label
                quintiles: [
                  ['<=', 20, 'Hasta 20 ha'],
                  [20, 60, 'Entre 20 y 60 ha'],
                  [60, 150, 'Entre 60 y 150 ha'],
                  [150, 300, 'Entre 150 y 300 ha'],
                  [300, '>','Más de 300 ha']
                ]
              },
              {
                value: 3,
                label: '1.5.3 Predios entregados a campesinos a través de procesos de adjudicación con registro de ORIP',
                descripcion: 'Cantidad de predios adjudicados',
                url: 'v_predios_campesinos_adj_mun',
                urlNal: 'v_predios_campesinos_adj_mun', // data a nivel nacional
                urlDepartal: 'v_predios_campesinos_adj_mun',
                urlNalDataAlfanumerica: '', // para alguna data adicional alfanuemrica
                fieldlabel: ['anio', 'genero_beneficiario'], // data a nivel municipal
                fieldlabelNal: ['anio', 'genero_beneficiario'], // labels a nivel nacional
                fieldlabelDepartal: ['anio', 'genero_beneficiario'], // leyenda a nivel nacional
                leyenda: ['Predios por año', 'Predios por tipo de género'], // las leyendas para cada label // leyenda a nivel dapartamental
                leyendaNal: ['Predios por año', 'Predios por tipo de género'], // labels a nivel municipal
                leyendaDepartal: ['Predios por año', 'Predios por tipo de género'],
                fieldValue: 'cantidad_predios',
                fieldValueNal: 'cantidad_predios', // labels a nivel departamental
                fieldValueDepartal: 'cantidad_predios', // data a nivel depatamental
                quintiles: [
                  ['<=', 5, 'Hasta 5 predios'],
                  [6, 10, 'Entre 6 y 10 predios'],
                  [11, 30, 'Entre 11 y 30 predios'],
                  [31, 50, 'Entre 31 y 50 predios'],
                  [50, '>', 'Más de 50 predios']
                ]
              },
              {
                value: 4,
                label: '1.5.4 Área de predios entregados a campesinos a través de procesos de adjudicación con registro de ORIP',
                descripcion: 'Cantidad de área de predios adjudicados (ha)',
                url: 'v_predios_campesinos_adj_mun',
                urlNal: 'v_predios_campesinos_adj_mun', // data a nivel nacional
                urlDepartal: 'v_predios_campesinos_adj_mun',
                urlNalDataAlfanumerica: '', // para alguna data adicional alfanuemrica
                fieldlabel: ['anio', 'genero_beneficiario'], // data a nivel municipal
                fieldlabelNal: ['anio', 'genero_beneficiario'], // labels a nivel nacional
                fieldlabelDepartal: ['anio', 'genero_beneficiario'], // leyenda a nivel nacional
                leyenda: ['Área por año (ha)', 'Área por tipo de género (ha)'], // las leyendas para cada label // leyenda a nivel dapartamental
                leyendaNal: ['Área por año (ha)', 'Área por tipo de género (ha)'], // labels a nivel municipal
                leyendaDepartal: ['Área por año (ha)', 'Área por tipo de género (ha)'],
                fieldValue: 'total_area_ha',
                fieldValueNal: 'total_area_ha', // labels a nivel departamental
                fieldValueDepartal: 'total_area_ha', // data a nivel depatamental
                quintiles: [
                  ['<=', 20, 'Hasta 20 ha'],
                  [20, 60, 'Entre 20 y 60 ha'],
                  [60, 150, 'Entre 60 y 150 ha'],
                  [150, 300, 'Entre 150 y 300 ha'],
                  [300, '=>', 'Más de 300 ha']
                ]
              },
              {
                value: 5,
                label: '1.5.5 Predios entregados a través subsidios integrales para la compra de tierras',
                descripcion: 'Cantidad de predios beneficiarios de subsidios integrales para la compra de tierras',
                url: 'v_predios_sub_integrales_mun',
                urlNal: 'v_predios_sub_integrales_mun', // data a nivel nacional
                urlDepartal: 'v_predios_sub_integrales_mun',
                urlNalDataAlfanumerica: '', // para alguna data adicional alfanuemrica
                fieldlabel: ['rango_subsidio_compra', 'genero_beneficiario'], // data a nivel municipal
                fieldlabelNal: ['rango_subsidio_compra', 'genero_beneficiario'], // labels a nivel nacional
                fieldlabelDepartal: ['rango_subsidio_compra', 'genero_beneficiario'], // leyenda a nivel nacional
                leyenda: ['Predios por rango de subsidio', 'Predios por beneficiario'], // las leyendas para cada label // leyenda a nivel dapartamental
                leyendaNal: ['Predios por rango de subsidio', 'Predios por beneficiario'], // labels a nivel municipal
                leyendaDepartal: ['Predios por rango de subsidio', 'Predios por beneficiario'],
                fieldValue: 'cantidad_predios',
                fieldValueNal: 'cantidad_predios', // labels a nivel departamental
                fieldValueDepartal: 'cantidad_predios', // data a nivel depatamental
                quintiles: [
                  ['<=', 1, 'Un predio'],
                  [2, 5, 'Entre 2 y 5 predios'],
                  [6, 10, 'Entre 6 y 10 predios'],
                  [11, 20, 'Entre 11 y 20 predios'],
                  [20, '=>', 'Más de 20 predios']
                ]
              },
              {
                value: 6,
                label: '1.5.6 Área de predios entregados através de subsidios integrales para la compra de tierras',
                descripcion: 'Cantidad de área de predios beneficiarios de subsidios integrales para la compra de tierras (ha)',
                url: 'v_predios_sub_integrales_mun',
                urlNal: 'v_predios_sub_integrales_mun', // data a nivel nacional
                urlDepartal: 'v_predios_sub_integrales_mun',
                urlNalDataAlfanumerica: '', // para alguna data adicional alfanuemrica
                fieldlabel: ['rango_subsidio_compra', 'genero_beneficiario'], // data a nivel municipal
                fieldlabelNal: ['rango_subsidio_compra', 'genero_beneficiario'], // labels a nivel nacional
                fieldlabelDepartal: ['rango_subsidio_compra', 'genero_beneficiario'], // leyenda a nivel nacional
                leyenda: ['Área por rango de subsidio (ha)', 'Área por beneficiario (ha)'], // las leyendas para cada label // leyenda a nivel dapartamental
                leyendaNal: ['Área por rango de subsidio (ha)', 'Área por beneficiario (ha)'], // labels a nivel municipal
                leyendaDepartal: ['Área por rango de subsidio (ha)', 'Área por beneficiario (ha)'],
                fieldValue: 'total_area_ha',
                fieldValueNal: 'total_area_ha', // labels a nivel departamental
                fieldValueDepartal: 'total_area_ha', // data a nivel depatamental
                quintiles: [
                  ['<=', 20, 'Hasta 20 ha'],
                  [20, 50, 'Entre 20 y 50 ha'],
                  [50, 100, 'Entre 50 y 100 ha'],
                  [100, 200, 'Entre 100 y 200 ha'],
                  [200, '>', 'Más de 200 ha']
                ]
              }
            ]
          }
        ]
      },
      {
        value: 3,
        label: '1.6 Formalización de la propiedad ',
        descripcion: '',
        CATEGORIA_TEMATICA: [
          {
            value: 0,
            label: '',
            descripcion: '',
            INDICADOR: [
              {
                value: 1,
                label: '1.6.1 Predios titulados a campesinos y registrados en ORIP',
                descripcion: 'Cantidad de predios formalizados',
                url: 'v_predios_campesinos_tit_mun',
                urlNal: 'v_predios_campesinos_tit_mun', // data a nivel nacional
                urlDepartal: 'v_predios_campesinos_tit_mun',
                urlNalDataAlfanumerica: '', // para alguna data adicional alfanuemrica
                fieldlabel: ['anio', 'proceso', 'genero_beneficiario'], // data a nivel municipal
                fieldlabelNal: ['anio', 'proceso', 'genero_beneficiario'], // labels a nivel nacional
                fieldlabelDepartal: ['anio', 'proceso', 'genero_beneficiario'], // leyenda a nivel nacional
                leyenda: ['Predios por año', 'Predios por proceso', 'Predios género beneficiario'], // las leyendas para cada label // leyenda a nivel dapartamental
                leyendaNal: ['Predios por año', 'Predios por proceso', 'Predios género beneficiario'], // labels a nivel municipal
                leyendaDepartal: ['Predios por año', 'Predios por proceso', 'Predios género beneficiario'],
                fieldValue: 'cantidad_predios',
                fieldValueNal: 'cantidad_predios', // labels a nivel departamental
                fieldValueDepartal: 'cantidad_predios', // data a nivel depatamental
                quintiles: [
                  ['<=', 30,'Hasta 30 predios'],
                  [31, 120,'Entre 31 y 120 predios'],
                  [121, 300,'Entre 121 y 300 predios'],
                  [301, 600,'Entre 301 y 600 predios'],
                  [600, '>', 'Más de 600 predios']
                ]
              },
              {
                value: 2,
                label: '1.6.2 Área de predios titulados  a campesinos y registrados en ORIP',
                descripcion: 'Cantidad de área de predios formalizados (ha)',
                url: 'v_predios_campesinos_tit_mun',
                urlNal: 'v_predios_campesinos_tit_mun', // data a nivel nacional
                urlDepartal: 'v_predios_campesinos_tit_mun',
                urlNalDataAlfanumerica: '', // para alguna data adicional alfanuemrica
                fieldlabel: ['anio', 'proceso', 'genero_beneficiario'], // data a nivel municipal
                fieldlabelNal: ['anio', 'proceso', 'genero_beneficiario'], // labels a nivel nacional
                fieldlabelDepartal: ['anio', 'proceso', 'genero_beneficiario'], // leyenda a nivel nacional
                leyenda: ['Área por año (ha)', 'Área por proceso (ha)', 'Área género beneficiario (ha)'], // las leyendas para cada label // leyenda a nivel dapartamental
                leyendaNal: ['Área por año (ha)', 'Área por proceso (ha)', 'Área género beneficiario (ha)'], // labels a nivel municipal
                leyendaDepartal: ['Área por año (ha)', 'Área por proceso (ha)', 'Área género beneficiario (ha)'],
                fieldValue: 'total_area_ha',
                fieldValueNal: 'total_area_ha', // labels a nivel departamental
                fieldValueDepartal: 'total_area_ha', // data a nivel depatamental
                quintiles: [
                  ['<=', 50, 'Hasta 50 ha'],
                  [50, 200, 'Entre 50 y 200 ha'],
                  [200, 400, 'Entre 200 y 400 ha'],
                  [400, 900, 'Entre 400 y 900 ha'],
                  [900, '=>','Más de 900 ha']
                ]
              },
              {
                value: 3,
                label: '1.6.3 Predios titulados a mujeres y registrados en ORIP',
                descripcion: 'Cantidad de predios formalizados a mujeres',
                url: 'v_predios_titulados_muj_mun',
                urlNal: 'v_predios_titulados_muj_mun', // data a nivel nacional
                urlDepartal: 'v_predios_titulados_muj_mun',
                urlNalDataAlfanumerica: '', // para alguna data adicional alfanuemrica
                fieldlabel: ['anio', 'proceso'], // data a nivel municipal
                fieldlabelNal: ['anio', 'proceso'], // labels a nivel nacional
                fieldlabelDepartal: ['anio', 'proceso'], // leyenda a nivel nacional
                leyenda: ['Predios por año', 'Predios por proceso'], // las leyendas para cada label // leyenda a nivel dapartamental
                leyendaNal: ['Predios por año', 'Predios por proceso'], // labels a nivel municipal
                leyendaDepartal: ['Predios por año', 'Predios por proceso'],
                fieldValue: 'cantidad_predios',
                fieldValueNal: 'cantidad_predios', // labels a nivel departamental
                fieldValueDepartal: 'cantidad_predios', // data a nivel depatamental
                quintiles: [
                  ['<=', 30,'Hasta 30 predios'],
                  [31, 120,'Entre 31 y 120 predios'],
                  [121, 300,'Entre 121 y 300 predios'],
                  [301, 600,'Entre 301 y 600 predios'],
                  [600, '>','Más de 600 predios']
                ]
              },
              {
                value: 4,
                label: '1.6.4 Área de predios titulados a mujeres y registrados en ORIP',
                descripcion: 'Cantidad de área de predios formalizados a mujeres (ha)',
                url: 'v_predios_titulados_muj_mun',
                urlNal: 'v_predios_titulados_muj_mun', // data a nivel nacional
                urlDepartal: 'v_predios_titulados_muj_mun',
                urlNalDataAlfanumerica: '', // para alguna data adicional alfanuemrica
                fieldlabel: ['anio', 'proceso'], // data a nivel municipal
                fieldlabelNal: ['anio', 'proceso'], // labels a nivel nacional
                fieldlabelDepartal: ['anio', 'proceso'], // leyenda a nivel nacional
                leyenda: ['Área por año (ha)', 'Área por proceso (ha)'], // las leyendas para cada label // leyenda a nivel dapartamental
                leyendaNal: ['Área por año (ha)', 'Área por proceso (ha)'], // labels a nivel municipal
                leyendaDepartal: ['Área por año (ha)', 'Área por proceso (ha)'],
                fieldValue: 'total_area_ha',
                fieldValueNal: 'total_area_ha', // labels a nivel departamental
                fieldValueDepartal: 'total_area_ha', // data a nivel depatamental
                quintiles: [
                  ['<=', 50,'Hasta 50 ha'],
                  [50, 200,'Entre 50 y 200 ha'],
                  [200, 400,'Entre 200 y 400 ha'],
                  [400, 900,'Entre 400 y 900 ha'],
                  [900, '>','Más de 900 ha']
                ]
              }
            ]
          }
        ]
      },
      {
        value: 4,
        label: '1.7 Catastro multipropósito',
        descripcion: '',
        CATEGORIA_TEMATICA: [
          {
            value: 0,
            label: '',
            descripcion: '',
            INDICADOR: [
              {
                value: 1,
                label: '1.7.1 Porcentaje de predios rurales actualizados',
                descripcion: 'Porcentaje de predios rurales actualizados',
                url: '', // trae info a nivel municipal
                urlNal: 'v_predios_actualizados_depto', //para data coropletica a nivel municipal // data a nivel nacional
                urlDepartal: 'v_predios_actualizados_depto',
                urlNalDataAlfanumerica: '', //para data alfanumerica a nivel nacional // para alguna data adicional alfanuemrica
                fieldlabel: ['anio_vigencia'], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature // data a nivel municipal
                fieldlabelNal: ['anio_vigencia'], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature // labels a nivel nacional
                fieldlabelDepartal: ['anio_vigencia'], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature // leyenda a nivel nacional
                leyenda: ['Porcentaje de predios por año'], // las leyendas para cada label // leyenda a nivel dapartamental
                leyendaNal: ['Porcentaje de predios por año'], // las leyendas para cada label // labels a nivel municipal
                leyendaDepartal: ['Porcentaje de predios por año'],
                fieldValue: 'porcentaje_predios', // estees el valor que tomara generar las cantidades para cada label
                fieldValueNal: 'porcentaje_predios', // estees el valor que tomara generar las cantidades para cada label // labels a nivel departamental
                fieldValueDepartal: 'porcentaje_predios', // estees el valor que tomara genera // data a nivel depatamentalr las cantidades para cada label
                quintiles: [
                  ['<=', 0, 'Sin predios actualizados'],
                  [0, 0.05, 'Hasta el 5% de los predios actualizados'],
                  [0.05, 0.2, 'Entre 5% y 20% de los predios actualizados'],
                  [0.2, 0.5,'Entre 20% y 50% de los predios actualizados'],
                  [0.5, '=>','Más del 50% de los predios actualizados']
                ]
              },
              {
                value: 2,
                label: '1.7.2 Porcentaje de área de predios rurales actualizados',
                descripcion: 'Porcentaje de área de predios rurales actualizados',
                url: '', // trae info a nivel municipal
                urlNal: 'v_predios_actualizados_depto', //para data coropletica a nivel municipal // data a nivel nacional
                urlDepartal: 'v_predios_actualizados_depto',
                urlNalDataAlfanumerica: '', //para data alfanumerica a nivel nacional // para alguna data adicional alfanuemrica
                fieldlabel: ['anio_vigencia'], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature // data a nivel municipal
                fieldlabelNal: ['anio_vigencia'], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature // labels a nivel nacional
                fieldlabelDepartal: ['anio_vigencia'], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature // leyenda a nivel nacional
                leyenda: ['Año de vigencia'], // las leyendas para cada label // leyenda a nivel dapartamental
                leyendaNal: ['Año de vigencia'], // las leyendas para cada label // labels a nivel municipal
                leyendaDepartal: ['Año de vigencia'],
                fieldValue: 'porcentaje_area', // estees el valor que tomara generar las cantidades para cada label
                fieldValueNal: 'porcentaje_area', // estees el valor que tomara generar las cantidades para cada label // labels a nivel departamental
                fieldValueDepartal: 'porcentaje_area', // estees el valor que tomara generar l // data a nivel depatamentalas cantidades para cada label
                quintiles: [
                  ['<=', 0,'Sin área actualizada'],
                  [0, 0.05,'Hasta el 5% de área actualizada'],
                  [0.05, 0.1,'Entre 5% y 10% de área actualizada'],
                  [0.1, 0.5,'Entre 10% y 50% de área actualizada'],
                  [0.5, '=>','Más del 50% del área actualizada']
                ]
              },
              {
                value: 3,
                label: '1.7.3 Cantidad de municipios actualizados en cada vigencia',
                descripcion: 'Cantidad de municipios actualizados en cada vigencia',
                url: '', // trae info a nivel municipal
                urlNal: 'v_municipios_actualizados_depto', //para data coropletica a nivel municipal // data a nivel nacional
                urlDepartal: 'v_municipios_actualizados_depto',
                urlNalDataAlfanumerica: '', //para data alfanumerica a nivel nacional // para alguna data adicional alfanuemrica
                fieldlabel: [], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature // data a nivel municipal
                fieldlabelNal: ['anio_vigencia', 'estado_actualizacion'], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature // labels a nivel nacional
                fieldlabelDepartal: ['anio_vigencia', 'estado_actualizacion'], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature // leyenda a nivel nacional
                leyenda: [], // las leyendas para cada label // leyenda a nivel dapartamental
                leyendaNal: ['Año vigencia', 'Estado de actualización'], // las leyendas para cada label // labels a nivel municipal
                leyendaDepartal: ['Año vigencia', 'Estado de actualización'],
                fieldValue: '', // estees el valor que tomara generar las cantidades para cada label
                fieldValueNal: 'cantidad_mpios', // estees el valor que tomara generar las cantidades para cada label // labels a nivel departamental
                fieldValueDepartal: 'cantidad_mpios', // estees el valor que tomara generar la // data a nivel depatamentals cantidades para cada label
                quintiles: [
                  ['<=', 0,'Sin municipios actualizados'],
                  [0, 1,'Un municipio actualizado'],
                  [1, 5,'Entre 2 y 5 municipios actualizados'],
                  [5, '>','Más de 5 municipios actualizados']
                ]
              }/* ,
              {
                value: 4,
                label: '1.7.4 Número de municipios formados en cada vigencia',
                descripcion: 'Número de municipios formados en cada vigencia',
                url: '', // trae info a nivel municipal
                urlNal: '', //para data coropletica a nivel municipal // data a nivel nacional
                urlDepartal: '',
                leyendaDepartal: [],
                urlNalDataAlfanumerica: '', //para data alfanumerica a nivel nacional // para alguna data adicional alfanuemrica
                fieldlabel: [], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature // data a nivel municipal
                fieldlabelNal: [], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature // labels a nivel nacional
                fieldlabelDepartal: [], // con esto se especifica la cantidad de graficas q se desplegaran segun la data de cada feature // leyenda a nivel nacional
                leyenda: [], // las leyendas para cada label // leyenda a nivel dapartamental
                leyendaNal: [], // las leyendas para cada label // labels a nivel municipal
                quintiles: [
                  'porDefinir'
                ]
              } */
            ]
          }
        ]
      }, 
      {
        value: 5,
        label: '1.8 Gestión de procesos de restitución de tierras',
        descripcion: '',
        CATEGORIA_TEMATICA: [
          {
            value: 0,
            label: '',
            descripcion: '',
            INDICADOR: [
              {
                value: 1,
                label: '1.8.1 Predios asociados a solicitudes de inscripción al Registro de Tierras Despojadas y Abandonadas Forzosamente',
                descripcion: 'Cantidad de predios asociados a solicitudes de inscripción al Registro de Tierras Despojadas y Abandonadas Forzosamente',
                url: 'v_predios_restierras_mun',
                urlNal: 'v_predios_restierras_mun', // data a nivel nacional
                urlDepartal: 'v_predios_restierras_mun',
                urlNalDataAlfanumerica: '', // para alguna data adicional alfanuemrica
                fieldlabel: ['pdet', 'nucleo_reforma'], // data a nivel municipal
                fieldlabelNal: ['pdet', 'nucleo_reforma'], // labels a nivel nacional
                fieldlabelDepartal: ['pdet', 'nucleo_reforma'], // leyenda a nivel nacional
                leyenda: ['Cantidad de predios por PDET', 'Cantidad de predios por reforma'], // las leyendas para cada label // leyenda a nivel dapartamental
                leyendaNal: ['Cantidad de predios por PDET', 'Cantidad de predios por reforma'], // labels a nivel municipal
                leyendaDepartal: ['Cantidad de predios por PDET', 'Cantidad de predios por reforma'],
                fieldValue: 'cantidad_predios',
                fieldValueNal: 'cantidad_predios', // labels a nivel departamental
                fieldValueDepartal: 'cantidad_predios', // data a nivel depatamental
                quintiles: [
                  ['<=', 30,'Hasta 30 predios'],
                  [31, 150,'Entre 31 y 150 predios'],
                  [151, 400,'Entre 151 y 400 predios'],
                  [401, 750,'Entre 401 y 750 predios'],
                  [750, '>','Más de 750 predios']
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    value: 2,
    label: '2. De delimitación, constitución y consolidación de zonas de reserva campesina, delimitación, uso y manejo de playones y sabanas comunales y de organización y capacitación campesina',
    descripcion: 'De delimitación, constitución y consolidación de zonas de reserva campesina, delimitación, uso y manejo de playones y sabanas comunales y de organización y capacitación campesina',
    APUESTA_ESTRATEGICA: [
      {
        value: 1,
        label: '2.2 Delimitar, consolidar y constituir las zonas de reserva campesina como territorialidad cuyo ordenamiento territorial se presta para frenar la expansión de la frontera agrícola, servir para la conservación ambiental y potenciar la producción de alimentos',
        descripcion: '',
        CATEGORIA_TEMATICA: [
          {
            value: 0,
            label: '',
            descripcion: '',
            INDICADOR: [
            /*  {
                value: 1,
                label: '2.2.1 Porcentaje de predios en Zonas de Reserva Campesina',
                descripcion: 'Porcentaje de predios en Zonas de Reserva Campesina',
                url: 'v_predios_zrc_mun',
                urlNal: 'v_predios_zrc_nacmun', // data a nivel nacional
                urlDepartal: 'v_predios_zrc_nacmun',
                urlNalDataAlfanumerica: '', // para alguna data adicional alfanuemrica
                fieldlabel: ['anio'], // data a nivel municipal
                fieldlabelNal: ['anio'], // labels a nivel nacional
                fieldlabelDepartal: ['anio'], // leyenda a nivel nacional
                leyenda: ['Porcentaje de predios por año'], // las leyendas para cada label // leyenda a nivel dapartamental
                leyendaNal: ['Porcentaje de predios por año'], // labels a nivel municipal
                leyendaDepartal: ['Predios ZRC por año'],
                fieldValue: 'porcentaje_predios',
                fieldValueNal: 'porcentaje_predios', // labels a nivel departamental
                fieldValueDepartal: 'porcentaje_predios', // data a nivel depatamental
                quintiles: [
                  'porDefinir'
                ]
              },*/
              {
                value: 2,
                label: '2.2.2 Porcentaje de área en ZRC',
                descripcion: 'Porcentaje de área en Zonas de Reserva Campesina',
                url: 'v_predios_zrc_mun',
                urlNal: 'v_predios_zrc_nacmun', // data a nivel nacional
                urlDepartal: 'v_predios_zrc_mun',
                urlNalDataAlfanumerica: '', // para alguna data adicional alfanuemrica
                fieldlabel: ['anio'], // data a nivel municipal
                fieldlabelNal: ['anio'], // labels a nivel nacional
                fieldlabelDepartal: ['anio'], // leyenda a nivel nacional
                leyenda: ['Porcentaje de área ZRC por año'], // las leyendas para cada label // leyenda a nivel dapartamental
                leyendaNal: ['Porcentaje de Área por año (ha)'], // labels a nivel municipal
                leyendaDepartal: ['Porcentaje área ZRC por año'],
                fieldValue: 'porcentaje_area',
                fieldValueNal: 'porcentaje_area', // labels a nivel departamental
                fieldValueDepartal: 'porcentaje_area', // data a nivel depatamental
                quintiles: [
                  ['<=', 0,'0% del área'],
                  [0, 0.1, 'Hasta 10% del área'],
                  [0.1, 0.3, 'Entre 10% y 30% del área'],
                  [0.3, 0.6, 'Entre 30% y 60% del área'],
                  [0.6, '=>', 'Mas del 60% del área']
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    value: 3,
    label: '3. De ordenamiento territorial y solución de conﬂictos socioambientales para la reforma agraria',
    descripcion: 'De ordenamiento territorial y solución de conﬂictos socioambientales para la reforma agraria',
    APUESTA_ESTRATEGICA: [
      {
        value: 0,
        label: '3.1 Gestión de conflictos relacionados con el acceso a los recursos naturales,  el uso, la ocupación y tenencia de la tierra; que se presenten al interior de  las áreas del SINAP, otras estrategias de conservación In situ, ecosistemas estratégicos, y sus áreas con función amortiguadora.',
        descripcion: 'Gestión de conflictos relacionados con el acceso a los recursos naturales,  el uso, la ocupación y tenencia de la tierra; que se presenten al interior de  las áreas del SINAP, otras estrategias de conservación In situ, ecosistemas estratégicos, y sus áreas con función amortiguadora.',
        CATEGORIA_TEMATICA: [
          {
            value: 0,
            label: 'Distribución de la tierra',
            descripcion: 'Distribución de la tierra',
            INDICADOR: [
              {
                value: 1,
                label: '3.1.1 Índice de Gini de la propiedad',
                descripcion: 'Índice de Gini de la propiedad',
                url: 'v_indice_gini_ids_mun', // municipios
                urlNal: 'v_indice_gini_ids_nac_tot', // data a nivel nacional
                // urlNal: 'v_indice_gini_ids_mun', // data a nivel nacional
                urlDepartal: 'v_indice_gini_ids_depto',
                // urlDepartal: 'v_indice_gini_ids_mun',
                urlNalDataAlfanumerica: '', // para alguna data adicional alfanuemrica
                fieldlabel: ['anio_vigencia'/* , 'destino' *//* , 'categoria_gini', 'categoria_ids' */], // data a nivel municipal
                fieldlabelNal: ['anio_vigencia'/* , 'destino' */], // labels a nivel nacional
                fieldlabelDepartal: ['anio_vigencia'/* , 'destino' */], // leyenda a nivel nacional
                leyenda: ['Indice Gini por año'/* , 'Indice Gini por destino' *//* , 'Indice Gini por categoria', 'Indice Gini por ids' */], // las leyendas para cada label // leyenda a nivel dapartamental
                leyendaNal: ['Indice Gini por año'/* , 'Indice Gini por destino' */], // labels a nivel municipal
                leyendaDepartal: ['Indice Gini por año'/* , 'Indice Gini por destino' */],
                fieldValue: 'gini',
                fieldValueNal: 'gini', // labels a nivel departamental
                fieldValueDepartal: 'gini', // data a nivel depatamental
                quintiles: [
                  ['<=', 0.3,'Desigualdad baja'],
                  [0.3, 0.6,'Desigualdad media'],
                  [0.6, 0.8,'Desigualdad alta'],
                  [0.8, '>','Desigualdad muy alta']
                ]
              },
              {
                value: 2,
                label: '3.1.2 Índice de Disparidad Superior - IDS',
                descripcion: 'Índice de Disparidad Superior - IDS',
                url: 'v_indice_gini_ids_mun', // data a nivel municipal
                urlNal: 'v_indice_gini_ids_nac_tot', // data a nivel nacional
                // urlNal: 'v_indice_gini_ids_mun', // data a nivel nacional
                urlDepartal: 'v_indice_gini_ids_depto',
                // urlDepartal: 'v_indice_gini_ids_mun', // data a nivel depatamental
                urlNalDataAlfanumerica: '', // para alguna data adicional alfanuemrica
                fieldlabel: ['anio_vigencia'/*, 'destino' , 'categoria_gini', 'categoria_ids' */], // labels a nivel municipal
                fieldlabelNal: ['anio_vigencia'/* , 'destino' */], // labels a nivel nacional
                fieldlabelDepartal: ['anio_vigencia'/* , 'destino' */], // labels a nivel departamental
                leyenda: ['Indice de Disparidad por año'/* , 'Indice de Disparidad por destino' *//* , 'Indice de Disparidad por categoria', 'Indice de Disparidad por ids' */], // las leyendas para cada label // leyenda a nivel dapartamental
                leyendaNal: ['Indice de Disparidad por año'/* , 'Indice de Disparidad por destino' */], // leyenda a nivel nacional
                leyendaDepartal: ['Indice de Disparidad por año'/* , 'Indice de Disparidad por destino' */],
                fieldValue: 'disparidad_superior',
                fieldValueNal: 'disparidad_superior',
                fieldValueDepartal: 'disparidad_superior',
                quintiles: [
                  ['<=', 2.7,'Disparidad superior baja'],
                  [2.7, 5.2,'Disparidad superior media'],
                  [5.2, 7.2,'Disparidad superior alta'],
                  [7.2, '=>','Disparidad superior muy alta']
                ]
              },
              {
                value: 3,
                label: '3.1.3 Porcentaje de predios con área por debajo de la UAF mínima municipal',
                descripcion: 'Porcentaje de predios con área por encima de la UAF mínima municipal',
                url: 'v_predios_uaf_mun', // data municipal
                urlNal: 'v_predios_uaf_mun', // data a nivel nacaional
                urlDepartal: 'v_predios_uaf_mun',
                urlNalDataAlfanumerica: '',
                fieldlabel: ['anio'],
                fieldlabelNal: ['anio'],
                fieldlabelDepartal: ['anio'],
                leyenda: ['Porcentaje de predios UAF'], // las leyendas para cada label
                leyendaNal: ['Porcetanje predios UAF'],
                leyendaDepartal: ['Porcetanje predios UAF'],
                fieldValue: 'porcentaje_predios',
                fieldValueNal: 'porcentaje_predios',
                fieldValueDepartal: 'porcentaje_predios',
                quintiles: [
                  ['<=', 0,'0% de los predios'],
                  [0, 0.6,'Hasta 60% de los predios'],
                  [0.6, 0.8,'Entre 60% y 80% de los predios'],
                  [0.8, 0.9,'Entre 80% y 90% de los predios'],
                  [0.9, '=>','Más del 90% de los predios']
                ]
              },
              {
                value: 4,
                label: '3.1.4 Porcentaje de área de predios por debajo de la UAF mínima municipal',
                descripcion: 'Porcentaje de área de predios por encima de la UAF mínima municipal (ha)',
                url: 'v_predios_uaf_mun', // data municipal
                urlNal: 'v_predios_uaf_mun', // data a nivel nacaional
                urlDepartal: 'v_predios_uaf_mun',
                urlNalDataAlfanumerica: '',
                fieldlabel: ['anio'],
                fieldlabelNal: ['anio'],
                fieldlabelDepartal: ['anio'],
                leyenda: ['Porcentaje de área UAF (ha)'], // las leyendas para cada label
                leyendaNal: ['Porcetanje área UAF (ha)'],
                leyendaDepartal: ['Porcetanje área UAF (ha)'],
                fieldValue: 'porcentaje_area',
                fieldValueNal: 'porcentaje_area',
                fieldValueDepartal: 'porcentaje_area',
                quintiles: [
                  ['<=', 0,'0% del área'],
                  [0, 0.1,'Hasta 10% del área'],
                  [0.1, 0.25,'Entre 10% y 25% del área'],
                  [0.25, 0.5,'Entre 25% y 50% del área'],
                  [0.5, '>','Más del 50% del área']
                ]
              },
              {
                value: 5,
                label: '3.1.5.Coeficiente de Gini para predios privados rurales del año 2024',
                descripcion: 'Coeficiente de Gini a nivel departamental para predios privados rurales del año 2024',
                url: 'v_indice_gini_predios_dest',
                urlNal: 'v_indice_gini_predios_dest',
                urlDepartal: 'v_indice_gini_predios_dest',
                urlNalDataAlfanumerica: '',
                fieldlabel: ['anio_vigencia'],
                fieldlabelNal: ['anio_vigencia'],
                fieldValueNal: 'gini',
                fieldlabelDepartal: ['anio_vigencia'],
                fieldValueDepartal: 'gini',
                leyenda: ['Coeficiente GINI'],
                leyendaNal: ['Coeficiente GINI'],
                leyendaDepartal: ['Coeficiente GINI'],
                quintiles: [
                  [0.6, 0.8, "Entre 60% a 80%"],
                  [0.8, 1.0, "Entre 80% a 100%"]
                ]
              },
              {
                value: 6,
                label: '3.1.6.Coeficiente de Gini para predios privados rurales dentro de frontera agrícola del año 2024',
                descripcion: 'Coeficiente de Gini a nivel departamental para predios privados rurales dentro de frontera agrícola del año 2024',
                url: '',
                urlNal: 'v_indice_gini_predios_frontAgric',
                urlDepartal: 'v_indice_gini_predios_frontAgric',
                urlNalDataAlfanumerica: '',
                fieldlabel: ['anio_vigencia'],
                fieldlabelNal: ['anio_vigencia'],
                fieldValueNal: 'gini',
                fieldlabelDepartal: ['anio_vigencia'],
                fieldValueDepartal: 'gini',
                leyenda: ['Coeficiente GINI'],
                leyendaNal: ['Coeficiente GINI'],
                leyendaDepartal: ['Coeficiente GINI'],
                quintiles: [
                  [0.4, 0.6, "Entre 40% a 60%"],
                  [0.6, 0.8, "Entre 61% a 80%"],
                  [0.8, 1.0, "Entre 81% a 100%"]
                ]
              },
              {
                value: 7,
                label: '3.1.7.Coeficiente de Gini para predios privados rurales dentro de frontera agrícola con destino agropecuario del año 2024',
                descripcion: 'Coeficiente de Gini a nivel departamental para predios privados rurales dentro de frontera agrícola con destino agropecuario del año 2024',
                 url: '',
                urlNal: 'v_indice_gini_predios_frontAgric_dest',
                urlDepartal: 'v_indice_gini_predios_frontAgric_dest',
                urlNalDataAlfanumerica: '',
                fieldlabel: ['anio_vigencia'],
                fieldlabelNal: ['anio_vigencia'],
                fieldValueNal: 'gini',
                fieldlabelDepartal: ['anio_vigencia'],
                fieldValueDepartal: 'gini',
                leyenda: ['Coeficiente GINI'],
                leyendaNal: ['Coeficiente GINI'],
                leyendaDepartal: ['Coeficiente GINI'],
                quintiles: [
                  [0.4, 0.6, "Entre 40% a 60%"],
                  [0.6, 0.8, "Entre 61% a 80%"],
                  [0.8, 1.0, "Entre 81% a 100%"]
                ]
              }
            ]
          },
          {
            value: 1,
            label: 'Conflictos de uso',
            descripcion: 'Conflictos de uso',
            INDICADOR: [
              {
                value: 1,
                label: '3.1.5 Porcentaje de predios con presunta subutilización en el uso del suelo',
                descripcion: 'Porcentaje de predios con presunta subutilización en el uso del suelo',
                url: 'v_predios_conflicto_mun', // data municipal
                urlNal: 'v_predios_conflicto_mun', // data a nivel nacaional
                urlDepartal: 'v_predios_conflicto_mun',
                urlNalDataAlfanumerica: '',
                fieldlabel: ['categoria_conflicto_uso'/* , 'total_predios_mun' */],
                fieldlabelNal: [/* 'total_predios_mun',  */'categoria_conflicto_uso'],
                fieldlabelDepartal: ['categoria_conflicto_uso'/* 'total_predios_mun',  */],
                leyenda: ['Porcentaje de predios por categoria'/* , 'Total predios por municipio' */], // las leyendas para cada label
                leyendaNal: ['Porcentaje de predios por categoria uso del suelo'],
                leyendaDepartal: ['Porcentaje de predios por categoria uso del suelo'],
                fieldValue: 'porcentaje_predios',
                fieldValueNal: 'porcentaje_predios',
                fieldValueDepartal: 'porcentaje_predios',
                quintiles: [
                  ['<=', 0,'Sin predios subutilizados'],
                  [0, 0.01,'Hasta el 1% de los predios'],
                  [0.01, 0.05,'Entre 1% y 5% de los predios'],
                  [0.05, 0.15,'Entre 5% y 15% de los predios'],
                  [0.15, '>','Más del 15% de los predios']
                ]
              },
              {
                value: 2,
                label: '3.1.6 Porcentaje de predios en Territorios con ley 2da',
                descripcion: 'Porcentaje de predios en Territorios con ley 2da',
                url: 'v_predios_ley2da_mun', // data municipal
                urlNal: 'v_predios_ley2da_mun', // data a nivel nacaional
                urlDepartal: 'v_predios_ley2da_mun',
                urlNalDataAlfanumerica: '',
                fieldlabel: ['anio'],
                fieldlabelNal: ['anio'],
                fieldlabelDepartal: ['anio'],
                leyenda: ['Porcentaje de predios por año'], // las leyendas para cada label
                leyendaNal: ['Porcentaje de predios en Territorios con ley 2da'],
                leyendaDepartal: ['Porcentaje de predios en Territorios con ley 2da'],
                fieldValue: 'porcentaje_area',
                fieldValueNal: 'porcentaje_area',
                fieldValueDepartal: 'porcentaje_area',
                quintiles: [
                  ['<=', 0, '0% del área'],
                  [0, 0.3, 'Hasta 30% del área'],
                  [0.3, 0.6, 'Entre 30% y 60% del área'],
                  [0.6, 0.9, 'Entre 60% y 90% del área'],
                  [0.9, '=>', 'Más del 90% del área']
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    value: 4,
    label: `8. De delimitación, constitución y consolidación de territorios indígenas y de territorios colectivos de comunidades negras, afrocolombianas,
            raizales, palenqueras y pueblo Rom, delimitación, uso, manejo y goce de los mismos, y fortalecimiento de la formación desde los saberes propios`,
    descripcion: `De delimitación, constitución y consolidación de territorios indígenas y de territorios colectivos de comunidades negras, afrocolombianas,
            raizales, palenqueras y pueblo Rom, delimitación, uso, manejo y goce de los mismos, y fortalecimiento de la formación desde los saberes propios`,
    APUESTA_ESTRATEGICA: [
      {
        value: 0,
        label: '8.1 Consolidar la seguridad jurídica de los territorios étnicos a partir de procedimientos de delimitación, constitución, ampliación, titulación colectiva, saneamiento y/o de restitución, según proceda, respetando los principios de autonomía y gobierno propio.',
        descripcion: '',
        CATEGORIA_TEMATICA: [
          {
            value: 0,
            label: '',
            descripcion: '',
            INDICADOR: [
              /*
              {
                value: 1,
                label: '8.1.1 Porcentaje de predios titulados y registrados en ORIP a grupos étnicos',
                descripcion: 'Porcentaje de predios en territorios títulados a grupos étnicos',
                url: 'v_predios_etnicos_por_mun', // data municipal
                urlNal: 'v_predios_etnicos_por_nacmun', // data a nivel nacaional
                urlDepartal: 'v_predios_etnicos_por_mun',
                urlNalDataAlfanumerica: '',
                fieldlabel: ['anio'],
                fieldlabelNal: ['anio'],
                fieldlabelDepartal: ['anio'],
                leyenda: ['Porcentaje predios títulados por año'], // las leyendas para cada label
                leyendaNal: ['Porcentaje predios títulados por año'],
                leyendaDepartal: ['Porcentaje predios títulados por año'],
                fieldValue: 'porcentaje_predios',
                fieldValueNal: 'porcentaje_predios',
                fieldValueDepartal: 'porcentaje_predios',
                quintiles: [
                  'porDefinir'
                ]
              },*/
              {
                value: 2,
                label: '8.1.2 Porcentaje de área titulada a grupos étnicos',
                descripcion: 'Porcentaje de área titulada y registrada en ORIP a grupos étnicos (ha)',
                url: 'v_predios_etnicos_por_mun', // data municipal
                urlNal: 'v_predios_etnicos_por_mun', // data a nivel nacaional
                urlDepartal: 'v_predios_etnicos_por_mun',
                urlNalDataAlfanumerica: '',
                fieldlabel: ['anio'],
                fieldlabelNal: ['anio'],
                fieldlabelDepartal: ['anio'],
                leyenda: ['Porcentaje área títulados por año (ha)'], // las leyendas para cada label
                leyendaNal: ['Porcentaje área títulados por año (ha)'],
                leyendaDepartal: ['Porcentaje área títulados por año (ha)'],
                fieldValue: 'porcentaje_area',
                fieldValueNal: 'porcentaje_area',
                fieldValueDepartal: 'porcentaje_area',
                quintiles: [
                  ['<=', 0, '0% del área'],
                  [0, 0.05, 'Hasta 5% del área'],
                  [0.05, 0.2, 'Entre 5% y 20% del área'],
                  [0.2, 0.5, 'Entre 20% y 50% del área'],
                  [0.5, '=>', 'Más del 50% del área']
                ]
              },
              {
                value: 3,
                label: '8.1.3 Predios titulados a grupos étnicos',
                descripcion: 'Predios titulados a grupos étnicos y registrados en ORIP',
                url: 'v_predios_etnicos_mun', // data municipal
                urlNal: 'v_predios_etnicos_mun', // data a nivel nacaional
                urlDepartal: 'v_predios_etnicos_mun',
                urlNalDataAlfanumerica: '',
                fieldlabel: ['cat_anio'],
                fieldlabelNal: ['cat_anio'],
                fieldlabelDepartal: ['cat_anio'],
                leyenda: ['Cantidad de predios por año'], // las leyendas para cada label
                leyendaNal: ['Cantidad de predios por año'],
                leyendaDepartal: ['Cantidad de predios por año'],
                fieldValue: 'cantidad_predios',
                fieldValueNal: 'cantidad_predios',
                fieldValueDepartal: 'cantidad_predios',
                quintiles: [
                  ['<=', 5, 'Hasta 5 predios'],
                  [5, 10, 'Entre 6 y 10 predios'],
                  [10, 15, 'Entre 11 y 15 predios'],
                  [15, 25, 'Entre 16 y 25 predios'],
                  [25, '=>', 'Más de 25 predios']
                ]
              },
              {
                value: 4,
                label: '8.1.4 Área titulada a grupos étnicos',
                descripcion: 'Área titulada a grupos étnicos con registro en ORIP (ha)',
                url: 'v_predios_etnicos_mun', // data municipal
                urlNal: 'v_predios_etnicos_mun', // data a nivel nacaional
                urlDepartal: 'v_predios_etnicos_mun',
                urlNalDataAlfanumerica: '',
                fieldlabel: ['cat_anio'],
                fieldlabelNal: ['cat_anio'],
                fieldlabelDepartal: ['cat_anio'],
                leyenda: ['Cantidad de Área por año (ha)'], // las leyendas para cada label
                leyendaNal: ['Cantidad de Área por año (ha)'],
                leyendaDepartal: ['Cantidad de Área por año (ha)'],
                fieldValue: 'total_area_ha',
                fieldValueNal: 'total_area_ha',
                fieldValueDepartal: 'total_area_ha',
                quintiles: [
                  ['<=', 500, 'Hasta 500 ha'],
                  [500, 2000, 'Entre 500 y 2,000 ha'],
                  [2000, 5000, 'Entre 2,000 y 5,000 ha'],
                  [5000, 30000, 'Entre 5,000 y 30,000 ha'],
                  [30000, '=>', 'Más de 30,000 ha']
                ]
              }
            ]
          }
        ]
      }
    ]
  }
]
