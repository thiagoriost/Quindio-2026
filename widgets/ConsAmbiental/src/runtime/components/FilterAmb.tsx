
/**
 * Sección importación componente FilterAmb
 * @date 2026-02-10
 * @author IGAC - DIP
 * @dateUpdated 2026-02-11
 * @changes Importar componente DatePicker
 **/

import React, { useEffect } from 'react';
import { Button, Input, Label, Radio, Select, TextInput, FloatingPanel } from 'jimu-ui';
//Componente DatePicker
import { DatePicker } from 'jimu-ui/basic/date-picker';

import { appActions } from 'jimu-core';

/**
 * Componente para definición de filtros asociados al widget
 * @date 2026-02-10
 * @author IGAC - DIP
 * @param visible
 * @param setVisibleState
 * @dateUpdated 2026-02-11
 * @changes inclusión param visible
 * @changes inclusión param setVisibleState
 * @changes inclusión param areaLst
 * @changes inclusión param setAreaLstState
 * @changes inclusión param selAreaVal
 * @changes inclusión param setSelAreaValState
 * @changes inclusión param selAreaDis
 * @changes inclusión param setAreaDisState
 * @changes inclusión param tematicaLst
 * @changes inclusión param setTematicaLstState
 * @changes inclusión param selTematicaVal
 * @changes inclusión param setSelTematicaValState
 * @changes inclusión param selTematicaDis
 * @changes inclusión param setSelTematicaDisState
 * @changes inclusión param categorLst
 * @changes inclusión param setCategorLstState
 * @changes inclusión param selCategorVal
 * @changes inclusión param setCategorValState
 * @changes inclusión param selCategorDis
 * @changes inclusión param setSelCategorDisState
 * @changes inclusión param subCategorLst
 * @changes inclusión param setSubCategorLstState
 * @changes inclusión param selSubCategorVal
 * @changes inclusión param setSelSubCategorValState
 * @changes inclusión param selSubCategorDis
 * @changes inclusión param setSelSubCategorDisState
 * @changes inclusión param nomAmbLst
 * @changes inclusión param setNomAmbLstState
 * @changes inclusión param selNomAmbVal
 * @changes inclusión param setSelNomAmbValState
 * @changes inclusión param selNomAmbDis
 * @changes inclusión param setSelNomAmbDisState
 * @changes inclusión param anioAmbLst
 * @changes inclusión param setAnioAmbLstState
 * @changes inclusión param selAnioAmbVal
 * @changes inclusión param setSelAnioAmbValState
 * @changes inclusión param selAnioAmbDis
 * @changes inclusión param setSelAnioAmbDisState
 * @changes inclusión param mpioAmbLst
 * @changes inclusión param setMpioAmbLstState
 * @changes inclusión param selMpioAmbVal
 * @changes inclusión param setSelMpioAmbValState
 * @changes inclusión param selMpioAmbDis
 * @changes inclusión param setSelMpioAmbDisState
 * @changes inclusión param txtFecIniVal
 * @changes inclusión param setTxtFecIniValState
 * @changes inclusión param txtFecIniDis
 * @changes inclusión param setTxtFecIniDisState
 * @changes inclusión param txtFecFinVal
 * @changes inclusión param setTxtFecFinValState
 * @changes inclusión param txtFecFinDis
 * @changes inclusión param setTxtFecFinDisState
 * @changes inclusión param btnLimpiaDis
 * @changes inclusión param setBtnLimpiaDisState
 * @changes inclusión param btnSrchDis
 * @changes inclusión param setBtnSrchDisState
 * @remarks Listado de propiedades enviadas desde el componente maestro
 * @remarks Pruebas con componente FloatingPanel desde jimu-ui
 * @remarks Fuente consulta Claude AI => https://claude.ai/chat/8298f344-84ec-44b9-b0bc-cb8328f56e40
 */

const FilterAmb = function ({visible, setVisibleState, areaLst, setAreaLstState, selAreaVal, setSelAreaValState, selAreaDis, setAreaDisState, tematicaLst, setTematicaLstState, selTematicaVal, setSelTematicaValState, selTematicaDis, setSelTematicaDisState, categorLst, setCategorLstState, selCategorVal, setCategorValState, selCategorDis, setSelCategorDisState, subCategorLst, setSubCategorLstState, selSubCategorVal, setSelSubCategorValState, selSubCategorDis, setSelSubCategorDisState, nomAmbLst, setNomAmbLstState, selNomAmbVal, setSelNomAmbValState, selNomAmbDis, setSelNomAmbDisState, anioAmbLst, setAnioAmbLstState, selAnioAmbVal, setSelAnioAmbValState, selAnioAmbDis, setSelAnioAmbDisState, mpioAmbLst, setMpioAmbLstState, selMpioAmbVal, setSelMpioAmbValState, selMpioAmbDis, setSelMpioAmbDisState, txtFecIniVal, setTxtFecIniValState, txtFecIniDis, setTxtFecIniDisState, txtFecFinVal, setTxtFecFinValState, txtFecFinDis, setTxtFecFinDisState, btnLimpiaDis, setBtnLimpiaDisState, btnSrchDis, setBtnSrchDisState}){

    //Sección métodos

    //Sección renderizado
    return (
        {selNomAmbDis} && <FloatingPanel         
        onHeaderClose={() => setVisibleState(false)}
        showHeaderCollapse={true}
        showHeaderClose={true}
        draggable={false}
        headerTitle="TEST FLOAT"
        defaultSize={{width: 332, height: 591 }}
        defaultPosition={{x: 150, y: 50}}
       >
         <form>
            <div className="mb-1">
                <Label size="default">&Aacute;rea</Label>
                <Select 
                placeholder="Seleccione"
                ></Select>
            </div>
            <div className="mb-1">
                <Label size="default">Tem&aacute;tica</Label>
                <Select 
                    placeholder="Seleccione"
                    disabled={selTematicaDis}
                    value={selTematicaVal}
                ></Select>
            </div>
            <div className="mb-1">
                <Label size="default">Categor&iacute;a</Label>
                <Select 
                    placeholder="Seleccione"
                    disabled={selCategorDis}
                    value={selCategorVal}
                ></Select>
            </div>
            <div className="mb-1">
                <Label size="default">SubCategor&iacute;a</Label>
                <Select 
                    placeholder="Seleccione"
                    disabled={selSubCategorDis}
                    value={selSubCategorVal}
                ></Select>
            </div>
            <div className="mb-1">
                <Label size="default">Nombre</Label>
                <Select 
                    placeholder="Seleccione"
                    disabled={selNomAmbDis}
                    value={selNomAmbVal}
                ></Select>
            </div>
            <div className="mb-1">
                <Label size="default">A&ntilde;o</Label>
                <Select 
                    placeholder="Seleccione"
                    disabled={selAnioAmbDis}
                    value={selAnioAmbVal}
                ></Select>
            </div>
            <div className="mb-1">
                <Label size="default">Municipio</Label>
                <Select 
                    placeholder="Seleccione"
                    disabled={selMpioAmbDis}
                    value={selMpioAmbVal}
                ></Select>
            </div>
            <div className="mb-1">
                <Label size="default">Fecha inicio</Label>
                {/*<Input 
                    placeholder='Especifique fecha'
                    disabled={txtFecIniDis}
                    value={txtFecIniVal}
                >
                </Input>*/
                }
                <DatePicker
                    selectedDate={txtFecIniVal}
                    onChange={(fecIn) => setTxtFecIniDisState (fecIn)}
                    format="yyyy-MM-dd"
                    showQuickNavToToday
                ></DatePicker>
            </div>
            <div className="mb-1">
                <Label size="default">Fecha fin</Label>
                {
                /*<Input 
                    placeholder='Especifique fecha'
                    disabled={txtFecFinDis}
                    value={txtFecFinVal}
                >
                </Input>*/
                }
                <DatePicker
                    selectedDate={txtFecFinVal}
                    onChange={(fecFin) => setTxtFecFinValState (fecFin)}
                    format="yyyyMMdd"
                ></DatePicker>
                
            </div>
            {/* Sección botonera*/}
            <div className="btns">
                <Button                           
                    size="default"
                    type="default"
                    disabled={btnLimpiaDis}
                >Limpiar
                </Button>
                <Button
                    htmlType="submit"              
                    size="default"
                    type="default"
                    disabled={btnSrchDis}
                >Buscar</Button>
            </div>
        </form>
    </FloatingPanel>
    )
}
export default FilterAmb;