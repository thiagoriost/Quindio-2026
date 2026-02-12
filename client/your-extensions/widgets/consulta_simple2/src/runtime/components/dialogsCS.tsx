/** 
    Sección de importación
    @date 2024-06-11
    @dateUpdated 2024-06-20
    @changes Inclusión dependencias Modal, ModalHeader, ModalBody, ModalFooter Icon desde jimu-ui    
*/

import { React } from "jimu-core";

import { Alert, Modal, ModalHeader, ModalBody, ModalFooter, Icon } from 'jimu-ui'; // import components

/**
 * Sección procesamiento widget => Componente DialogsCS correspondiente a la implementación de interfaz gráfica, componentes Alert y Modal
 * @date 2024-06-25
 * @author IGAC - DIP
 * @param (string) msg: Mensaje principal para el modal  
 * @param (any) setAlertDial: Método para asignar al objeto alertDial  
 * @param (string) mensModal: Objeto que contiene el mensaje para visualizar en el componente modal.
 * @param (any) setMensModal: Método para asignar al objeto mensModal
 * @dateUpdated 2024-06-20
 * @changes Adicionar objeto mensModal para persitir mensaje en el componente Modal
 * @remarks método traido del API en URL https://developers.arcgis.com/experience-builder/storybook/?path=/docs/components-jimu-ui-index-modal--docs 
 */

const DialogsCS = function({setAlertDial, mensModal, setMensModal}){

    /**
     * método showDialog => componente Dialog para visualizar en la interfaz
     * @date 2024-06-19
     * @author IGAC - DIP
     * @param msg => Mensaje asociado al alert    
     * @returns Componente <Alert> asociado a la libreria jimu-ui
     */

    // const showDialog = function(msg: string){
    //     return (
    //       <Alert
    //             buttonType="default"
    //             size="medium"
    //             closable
    //             onClose={() => setAlertDial(false)}
    //             text={msg}
    //             //text="No se cumplen los criterios!"
    //             type="warning"
    //             withIcon
    //       ></Alert>
    //     );
    //   };

      /**
     * Método showModal => componente Modal flotante para visualizar en interfaz
     * @date 2024-06-20
     * @author IGAC - DIP
     * @param (string) msg: Mensaje principal para el modal     
     * @remarks método traido del API en URL https://developers.arcgis.com/experience-builder/storybook/?path=/docs/components-jimu-ui-index-modal--docs 
     */
    // const showModal = function(msg?: string){      
    //     // console.log("Estado Modal =>",mensModal.deployed);
    //     return (
    //       <div>
    //         <Modal          
    //           toggle={function (e){
    //             console.log("Haciendo clic por fuera del modal...=>",e);
    //             setMensModal({...mensModal, deployed:false})
    //           }}
    //           isOpen={mensModal.deployed}
    //         >
    //           <ModalHeader
    //             closeIcon={<Icon icon="<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; fill=&quot;none&quot; viewBox=&quot;0 0 16 16&quot;><path fill=&quot;#000&quot; d=&quot;m8.745 8 6.1 6.1a.527.527 0 1 1-.745.746L8 8.746l-6.1 6.1a.527.527 0 1 1-.746-.746l6.1-6.1-6.1-6.1a.527.527 0 0 1 .746-.746l6.1 6.1 6.1-6.1a.527.527 0 0 1 .746.746z&quot;></path></svg>" />}
    //             toggle={function (e){ setMensModal({...mensModal, deployed: false})}}>
    //               {mensModal.tittle}
    //           </ModalHeader>
    //           <ModalBody>
    //             <Alert
    //                     buttonType="default"
    //                     size="medium"                    
    //                     onClose={() => setAlertDial(false)}
    //                     text={mensModal.body}
    //                     //text="No se cumplen los criterios!"
    //                     type={mensModal.type}
    //                     //type="warning"
    //                     withIcon
                        
    //               ></Alert>                
    //           </ModalBody>
    //           <ModalFooter>              
    //           </ModalFooter>
    //         </Modal>
    //       </div>
    //     )
    //   };
    
    return (
        <div>
            <Modal          
            toggle={function (e){
                setMensModal({...mensModal, deployed:false})
            }}
            isOpen={mensModal.deployed}
            >
            <ModalHeader
                closeIcon={<Icon icon="<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; fill=&quot;none&quot; viewBox=&quot;0 0 16 16&quot;><path fill=&quot;#000&quot; d=&quot;m8.745 8 6.1 6.1a.527.527 0 1 1-.745.746L8 8.746l-6.1 6.1a.527.527 0 1 1-.746-.746l6.1-6.1-6.1-6.1a.527.527 0 0 1 .746-.746l6.1 6.1 6.1-6.1a.527.527 0 0 1 .746.746z&quot;></path></svg>" />}
                toggle={function (e){ setMensModal({...mensModal, deployed: false})}}>
                {mensModal.tittle}
            </ModalHeader>
            <ModalBody>
                <Alert
                        buttonType="default"
                        size="medium"                    
                        onClose={() => setAlertDial(false)}
                        text={mensModal.body}
                        //text="No se cumplen los criterios!"
                        type={mensModal.type}
                        //type="warning"
                        withIcon
                        
                ></Alert>                
            </ModalBody>
            <ModalFooter>              
            </ModalFooter>
            </Modal>
        </div>
    );
}

export default DialogsCS