const diccionario = {
    indicadores:{
        decodigo:"decodigo",
        cantidad_predios:"cantidad_predios",
        mpcodigo:"mpcodigo"
    }
}

/* const coloresMapaCoropletico = [
    { colorRgb: 'rgb(214, 234, 248, 0.9)', value: [214, 234, 248, 0.9] },
    { colorRgb: 'rgb(133, 193, 233, 0.9)', value: [133, 193, 233, 0.9] },
    { colorRgb: 'rgb(46, 134, 193, 0.9)', value: [46, 134, 193, 0.9] },
    { colorRgb: 'rgb(33, 97, 140, 0.9)', value: [33, 97, 140, 0.9] },
    { colorRgb: 'rgb(21, 67, 96, 0.9)',   value: [21, 67, 96, 0.9] },
    // { colorRgb: 'rgb(52, 152, 219, 0.1)', value: [52, 152, 219, 0.1] },
] */
const opacity = 0.7
const coloresMapaCoropletico = [
    { colorRgb: `rgb(52, 152, 219, ${opacity})`, value: [52, 152, 219, opacity] },
    { colorRgb: `rgb(22, 160, 133, ${opacity})`, value: [22, 160, 133, opacity] },
    { colorRgb: `rgb(46, 204, 113, ${opacity})`, value: [46, 204, 113, opacity] },
    { colorRgb: `rgb(243, 156, 18, ${opacity})`, value: [243, 156, 18, opacity] },
    { colorRgb: `rgb(211, 84,   0, ${opacity})`, value: [211, 84, 0, opacity] },
    // { colorRgb: 'rgb(52, 152, 219, 0.1)', value: [52, 152, 219, 0.1] },
]

export {
    diccionario,
    coloresMapaCoropletico
}
