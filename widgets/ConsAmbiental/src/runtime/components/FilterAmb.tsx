
/**
 * Sección importación componente FilterAmb
 * @date 2026-02-10
 * @author IGAC - DIP
 **/

import React, { useEffect } from 'react';
import { Button, Input, Label, Radio, Select, TextInput, FloatingPanel } from 'jimu-ui';

import { appActions } from 'jimu-core';

/**
 * Componente para definición de filtros asociados al widget
 * @date 2026-02-10
 * @author IGAC - DIP
 * @param visible
 * @param setVisibleState
 * @dateUpdated 2026-02-11
 * @changes inclusión param {visible}
 * @changes inclusión param {setVisibleState}
 * @remarks Listado de propiedades enviadas desde el componente maestro
 * @remarks Pruebas con componente FloatingPanel desde jimu-ui
 * @remarks Fuente consulta Claude AI => https://claude.ai/chat/8298f344-84ec-44b9-b0bc-cb8328f56e40
 */

const FilterAmb = function ({visible, setVisibleState}){
    return (
        <FloatingPanel         
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
                ></Select>
            </div>
            <div className="mb-1">
                <Label size="default">Categor&iacute;a</Label>
                <Select 
                    placeholder="Seleccione"
                ></Select>
            </div>
            <div className="mb-1">
                <Label size="default">SubCategor&iacute;a</Label>
                <Select 
                    placeholder="Seleccione"
                ></Select>
            </div>
            <div className="mb-1">
                <Label size="default">Nombre</Label>
                <Select 
                    placeholder="Seleccione"
                ></Select>
            </div>
            <div className="mb-1">
                <Label size="default">A&ntilde;o</Label>
                <Select 
                    placeholder="Seleccione"
                ></Select>
            </div>
            <div className="mb-1">
                <Label size="default">Municipio</Label>
                <Select 
                    placeholder="Seleccione"
                ></Select>
            </div>
            <div className="mb-1">
                <Label size="default">Fecha inicio</Label>
                <Input placeholder='Especifique fecha'></Input>
            </div>
            <div className="mb-1">
                <Label size="default">Fecha fin</Label>
                <Input placeholder='Especifique fecha'></Input>
            </div>
            {/* Sección botonera*/}
            <div className="btns">
                <Button                           
                    size="default"
                    type="default"
                >Limpiar
                </Button>
                <Button
                    htmlType="submit"              
                    size="default"
                    type="default"
                >Buscar</Button>
            </div>
        </form>
    </FloatingPanel>
    )
}
export default FilterAmb;