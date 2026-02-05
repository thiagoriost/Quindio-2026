import React, { useState } from 'react'
import { InterfaceFeaturesLayersDeployed } from '../../types/interfaces';
import '../../styles/style.css'

/**
 * Widget que se encarga de manejar el drag and drop en el tab order capas
 * @author Rigoberto Rios - rigoriosh@gmail.com
 * @param param0 
 * @returns 
 */
const DragAndDrop = ({items, setItems, setBanderaRefreshCapas}) => {
    
  const [draggedItem, setDraggedItem] = useState(null); //almacena el item seleccionado

  /**
   * captura el inicio del item q se esta arrastrando
   * @param event 
   * @param index 
   */
  const handleDragStart = (event:any, index:number) => {
    setDraggedItem(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', event.target.parentNode);
    event.target.classList.add('dragging');
  };

  /**
   * Captura el momento en el que se mueve el item a cambiar de nivel
   * @param event 
   * @param index 
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
   * Captura el momento en el que se suelta el item a cambiar de nivel
   * @param event 
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