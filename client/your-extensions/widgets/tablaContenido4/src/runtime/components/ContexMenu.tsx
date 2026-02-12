/**
 * @fileoverview Componente de menú contextual para capas.
 * Muestra opciones de transparencia y metadatos al hacer clic derecho en una capa.
 * 
 * @module tablaContenido4/components/ContexMenu
 * @requires jimu-ui
 * @requires jimu-arcgis
 */

import { Slider } from 'jimu-ui';
import React, { ChangeEvent } from 'react'
import { JimuMapView } from 'jimu-arcgis';
import { InterfaceContextMenu } from '../../types/interfaces';
import { CloseCircleOutlined } from 'jimu-icons/outlined/editor/close-circle'
import '../../styles/styles_ContexMenu.css'

/**
 * Props del componente ContexMenu.
 * @interface ContexMenu_Props
 */
interface ContexMenu_Props {
    /** Datos del menú contextual (posición y capa seleccionada) */
    contextMenu: InterfaceContextMenu;
    /** Referencia al mapa de Jimu */
    varJimuMapView: JimuMapView;
    /** Setter para cerrar el menú contextual */
    setContextMenu?: any;
}

/**
 * Componente de menú contextual que aparece al hacer clic derecho en una capa.
 * Permite ajustar la transparencia de la capa y acceder a los metadatos.
 * 
 * @component
 * @param {ContexMenu_Props} props - Propiedades del componente
 * @returns {JSX.Element} Menú contextual con opciones de la capa
 * 
 * @example
 * <ContexMenu 
 *   contextMenu={contextMenuState} 
 *   setContextMenu={setContextMenu} 
 *   varJimuMapView={mapView} 
 * />
 * 
 * @author IGAC - DIP
 * @since 2024
 */
export const ContexMenu: React.FC<ContexMenu_Props> = ({contextMenu, setContextMenu, varJimuMapView}) => {


    /**
     * Captura el valor del slider y actualiza la opacidad de la capa.
     * El valor del slider va de 0-10 y se convierte a opacidad 0-1.
     * 
     * @param {ChangeEvent<HTMLInputElement>} param0 - Evento del slider
     * @returns {void}
     */
    const handleChangeSlider = ({target}: ChangeEvent<HTMLInputElement>): void => {
        contextMenu.capa_Feature.layer.opacity = Number(target.value)/10;
    }

    /**
     * Abre una nueva ventana/pestaña con la URL de metadata especificada.
     * 
     * @param {string} url - URL del servicio de metadata a abrir
     * @returns {void}
     */
    const abrirMetadata = (url: string) => {        
        window.open(url, '_blank', 'noopener,noreferrer');
    }

  return (
    <>
        {
            (contextMenu && (contextMenu?.capa_Feature?.capa.METADATOCAPA || contextMenu?.capa_Feature?.capa.METADATOSERVICIO || contextMenu.capa_Feature.capa.VISIBLE)) && (
                <div
                    className='container_contextmenu'
                    style={{                        
                        top: contextMenu.mouseY,
                        left: contextMenu.mouseX,                        
                    }}
                >
                    <div className='row_contextmenu'>
                        <CloseCircleOutlined size='m' color='red' onClick={()=>setContextMenu(null)} className='pointer'/>
                        <p>{contextMenu.capa_Feature.capa.TITULOCAPA}</p>
                    </div>
                    <hr />
                    {
                        contextMenu.capa_Feature.capa.VISIBLE && 
                            <>
                                <Slider defaultValue={10} onChange={handleChangeSlider} size='sm' min={0} max={10} step={1}/>
                                <hr />
                            </>
                    }
                    {
                        contextMenu.capa_Feature.capa.METADATOCAPA &&
                            <p className='pointer' onClick={()=>abrirMetadata(contextMenu.capa_Feature.capa.METADATOCAPA)}>Metadato Capa</p>
                    }
                    {
                        contextMenu.capa_Feature.capa.METADATOSERVICIO &&
                            <p className='pointer' onClick={()=>abrirMetadata(contextMenu.capa_Feature.capa.METADATOSERVICIO)}> Metadato Servicio</p>                    
                    }
                </div>
            )
        }
    </>



  )
}
