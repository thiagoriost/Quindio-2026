import { type IMThemeVariables, css, SerializedStyles } from 'jimu-core';

export const getStyle = (theme: IMThemeVariables): SerializedStyles => {
  return css`
    /* Forzar que el widget use todo el alto del panel del Controller */
    height: 100% !important;
    display: flex;
    flex-direction: column;

    .widget-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      /* Asegurar que la tabla ocupe el espacio restante */
      .table-container {
        flex: 1;
        overflow: auto;
        min-height: 0;
      }
    }
    
    /* Si usas la Table de jimu-ui, esto ayuda a que no colapse */
    .jimu-table {
      width: 100%;
    }
  `;
};