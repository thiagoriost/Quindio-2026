/**
 * @fileoverview Componente de Drag and Drop para reordenar capas.
 * Permite cambiar el orden de las capas mediante arrastrar y soltar.
 * 
 * @module tablaContenido4/components/DragAndDrop
 * @requires react
 */

import React, { useState } from 'react'
import { InterfaceFeaturesLayersDeployed } from '../../types/interfaces';
import '../../styles/style.css'

/**
 * Componente que implementa funcionalidad Drag and Drop para reordenar capas.
 * Se utiliza en el tab "Orden de Capas" para cambiar el orden de visualización.
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {InterfaceFeaturesLayersDeployed[]} props.items - Array de capas desplegadas
 * @param {Function} props.setItems - Setter para actualizar el orden de las capas
 * @param {Function} props.setBanderaRefreshCapas - Bandera para forzar actualización del mapa
 * @returns {JSX.Element} Lista de capas con funcionalidad drag and drop
 * 
 * @author Rigoberto Rios - rigoriosh@gmail.com
 * @since 2024
 */
const DragAndDrop = ({items, setItems, setBanderaRefreshCapas}) => {
    
  /** @type {number|null} Índice del item que se está arrastrando */
  const [draggedItem, setDraggedItem] = useState(null);

  /**
   * Captura el inicio del arrastre de un item.
   * Configura el estado y los efectos visuales del drag.
   * 
   * @param {DragEvent} event - Evento de drag
   * @param {number} index - Índice del item arrastrado
   * @returns {void}
   */
  const handleDragStart = (event:any, index:number) => {
    setDraggedItem(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', event.target.parentNode);
    event.target.classList.add('dragging');
  };

  /**
   * Captura cuando un item es arrastrado sobre otro.
   * Reordena los items en tiempo real durante el arrastre.
   * 
   * @param {DragEvent} event - Evento de drag over
   * @param {number} index - Índice del item sobre el que se arrastra
   * @returns {void}
   */
  const handleDragOver = (event:any, index:number) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const draggedIndex = draggedItem;
    if (draggedIndex !== index) {
      const newItems = [...items];
      const [removed] = newItems.splice(draggedIndex, 1);
      newItems.splice(index, 0, removed);
      setItems(newItems);
      setDraggedItem(index);
      setBanderaRefreshCapas((e: boolean) => !e)
    }
  };


  /**
   * Captura cuando se suelta el item arrastrado.
   * Limpia los estilos y el estado del drag.
   * 
   * @param {DragEvent} event - Evento de drag end
   * @returns {void}
   */
  const handleDragEnd = (event:any) => {
    event.target.classList.remove('dragging');
    setDraggedItem(null);
  };

  return (
    <ul className="drag-and-drop">
      {items.map((item: InterfaceFeaturesLayersDeployed, index: number) => (
        <>
          <li
            key={index}
            className={`draggable ${draggedItem === index ? 'dragging' : ''} pointer`}
            draggable
            onDragStart={(event) => handleDragStart(event, index)}
            onDragOver={(event) => handleDragOver(event, index)}
            onDragEnd={handleDragEnd}
          >
            - {item.capa.NOMBRETEMATICA} - {item.capa.TITULOCAPA}
          </li>
          <hr />
        </>
      ))}
    </ul>
  );
}

export default DragAndDrop