import { React, AllWidgetProps } from "jimu-core";
import { useState } from "react";
import { FaChevronRight, FaChevronDown } from 'react-icons/fa';
import { interfCapa } from "../../types/interfaces";

import './style.css';




const renderTree = (nodes) => {

  const [expandedItems, setExpandedItems] = useState({});
  const [checkedItems, setCheckedItems] = useState({});


    // Manejar expansión y colapso de las temáticas
  const handleExpandCollapse = (id) => {
    console.log("expand => ", {id})
    setExpandedItems(prevState => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  const handleCheck = (capa: interfCapa) => {
    const capaTemp = capa.capasNietas ? capa.capasNietas[0].IDCAPA:capa.IDCAPA
    setCheckedItems(prevState => ({
      ...prevState,
      [capaTemp]: !prevState[capaTemp],
    }));
  };
    
    const Node = ({ node, level = 0 }) => {
        const isExpanded = expandedItems[node.IDTEMATICA];
        const hasChildren = 
            (node.capasHijas?.length >= 1) ||
            (node.capasNietas?.length > 0 && node.IDTEMATICAPADRE > 0) ||
            (node.capasBisnietos?.length >= 1 );
          
        const isChecked = node.capasNietas ? node.capasNietas[0].IDCAPA:node.IDCAPA
        return (
          <div style={{ marginLeft: level * 20 + 'px' }}>
            <div>
              <span onClick={() => handleExpandCollapse(node.IDTEMATICA)} style={{ cursor: 'pointer' }}>
                {hasChildren ? (isExpanded ? <FaChevronDown /> : <FaChevronRight />) : null}
              </span>
              {
                ((node.URL || (node.capasNietas?.length < 2 && node.IDTEMATICAPADRE == 0)) ) ? (
                  <input 
                    type="checkbox" 
                    checked={!!checkedItems[isChecked]} 
                    onChange={() => handleCheck(node)} 
                  />
                ) : null
              }
              { 
                (((node.capasHijas?.length >= 1) || (node.capasNietas?.length > 1) || (node.capasBisnietos?.length >= 1)
                || (node.IDTEMATICAPADRE > 0 ) && !node.URL) )
                  ? node.NOMBRETEMATICA 
                  : node.TITULOCAPA
              }
            </div>
            {isExpanded && hasChildren && (
              <div>
                {node.capasHijas && node.capasHijas.map(child => (
                  <Node key={child.IDTEMATICA} node={child} level={level + 1} />
                ))}
                {node.capasNietas && node.capasNietas.map(child => (
                  <Node key={child.IDTEMATICA} node={child} level={level + 1} />
                ))}
                {node.capasBisnietos && node.capasBisnietos.map(child => (
                  <Node key={child.IDTEMATICA} node={child} level={level + 1} />
                ))}
              </div>
            )}
          </div>
        );
    };


    return nodes.map(node => (
      <Node key={node.IDTEMATICA} node={node} />
    ));
  };


export default renderTree;