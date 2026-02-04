export const exportToCSV = (rows, fileName) => {
    const csvData = [];

    // Encabezados del CSV
    const headers = Object.keys(rows[0]);
    csvData.push(headers.join(','));

    // Filas de datos del CSV
    rows.forEach(row => {
      const values = headers.map(header => row[header]);
      csvData.push(values.join(','));
    });

    // Convertir el array a una cadena
    const csvString = csvData.join('\n');

    // Crear un blob y una URL para el archivo CSV
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    // Crear un enlace y simular un clic para descargar el archivo
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Liberar la URL
    window.URL.revokeObjectURL(url);
};