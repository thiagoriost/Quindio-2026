export function capitalizarPalabras(texto: string) {
    if (!texto)
        return texto;
    const str = "" + texto;
    return str
    .toLowerCase()
    .replace(/(^|\s)\p{L}/gu, m => m.toUpperCase())
}