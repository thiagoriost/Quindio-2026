import { Slider } from 'jimu-ui';
import React, { ChangeEvent } from 'react'
import { JimuMapView } from 'jimu-arcgis';
import { InterfaceContextMenu } from '../../types/interfaces';
import { CloseCircleOutlined } from 'jimu-icons/outlined/editor/close-circle'
import '../../styles/styles_ContexMenu.css'

interface ContexMenu_Props {
    contextMenu: InterfaceContextMenu;
    varJimuMapView: JimuMapView;
    setContextMenu?: any;
}

/**
 * Componente encargado de renderizar al dar click derecho en una capa, el ContexMenu
 * con las opciones de transparencia, info metadatas, si aplican
 * @param param0 
 * @returns 
 */
export const ContexMenu: React.FC<ContexMenu_Props> = ({contextMenu, setContextMenu, varJimuMapView}) => {


    /**
     * capatura el valor del slider y cambia la opacidad de la capa.
     */
    const handleChangeSlider = ({target}: ChangeEvent<HTMLInputElement>): void => {
        contextMenu.capa_Feature.layer.opacity = Number(target.value)/10;
    }

    /**
     *  Se encar de abrir una ventana nueva apuntando al servidor de la metadata
     * @param url // sobre la que abrila la nueva ventana
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
