import React, { useState, useEffect, type Dispatch, type SetStateAction } from 'react'
import { RightOutlined } from 'jimu-icons/outlined/directional/right'
import { WrongOutlined } from 'jimu-icons/outlined/suggested/wrong'
import { DownOutlined } from 'jimu-icons/outlined/directional/down'
import { ClearOutlined } from 'jimu-icons/outlined/editor/clear'
import { Tab, TabList,Tabs, TabPanel} from 'react-tabs'
import FeatureLayer from "@arcgis/core/layers/FeatureLayer"
import { ContexMenu } from './ContexMenu'
import type { JimuMapView } from 'jimu-arcgis'
import { Button } from 'jimu-ui'
import DragAndDrop from './DragAndDrop'
import type { InterfaceContextMenu, InterfaceFeaturesLayersDeployed, ItemResponseTablaContenido, TreeNode } from '../../types/interfaces'
import 'rc-slider/assets/index.css'; import 'react-tabs/style/react-tabs.css'
import '../../styles/style.css'
import '../../styles/styles_widgetTree.css'

/**
 * Construye un árbol jerárquico a partir de un array plano de datos
 * usando IDTEMATICA e IDTEMATICAPADRE como campos clave
 * Los elementos con URL son capas (nivel más bajo, chequeables)
 * Los elementos sin URL son temáticas (carpetas/agrupadores)
 * @param flatData Array plano de datos de la tabla de contenido
 * @returns Array de nodos raíz del árbol
 */
const buildTree = (flatData: ItemResponseTablaContenido[]): TreeNode[] => {
    if (!flatData || flatData.length === 0) return []

    // Mapa para acceso rápido por IDTEMATICA
    const tematicaMap = new Map<number, TreeNode>()
    // Array para almacenar capas (elementos con URL)
    const capas: TreeNode[] = []

    // Helper para normalizar IDs a número
    const toNumber = (val: any): number => {
        if (val === null || val === undefined) return 0
        const num = Number(val)
        return isNaN(num) ? 0 : num
    }

    // Helper para verificar si tiene URL válida
    const hasValidUrl = (item: ItemResponseTablaContenido): boolean => {
        return !!(item.URL && item.URL.trim() !== '')
    }

    // Primera pasada: separar temáticas (sin URL) y capas (con URL)
    flatData.forEach(item => {
        const idTematica = toNumber(item.IDTEMATICA)
        const idTematicaPadre = toNumber(item.IDTEMATICAPADRE)

        if (hasValidUrl(item)) {
            // Es una capa con URL
            capas.push({
                ...item,
                IDTEMATICA: idTematica,
                IDTEMATICAPADRE: idTematicaPadre,
                children: []
            })
        } else {
            // Es una temática (sin URL) - crear nodo si no existe
            if (!tematicaMap.has(idTematica)) {
                const node: TreeNode = {
                    ...item,
                    IDTEMATICA: idTematica,
                    IDTEMATICAPADRE: idTematicaPadre,
                    children: []
                }
                tematicaMap.set(idTematica, node)
            }
        }
    })

    // Si no hay temáticas explícitas, crearlas a partir de los IDTEMATICAPADRE únicos de las capas
    if (tematicaMap.size === 0 && capas.length > 0) {
        // Encontrar todos los IDTEMATICAPADRE únicos que necesitan ser temáticas
        const idsNecesarios = new Set<number>()
        capas.forEach(capa => {
            const idPadre = toNumber(capa.IDTEMATICAPADRE)
            if (idPadre !== 0) {
                idsNecesarios.add(idPadre)
            }
        })

        // Crear temáticas para cada ID necesario
        idsNecesarios.forEach(id => {
            // Buscar una capa que tenga información sobre esta temática
            const capaReferencia = capas.find(c => toNumber(c.IDTEMATICAPADRE) === id)
            if (capaReferencia) {
                // También buscar el padre de esta temática
                const otraCapa = flatData.find(item => toNumber(item.IDTEMATICA) === id)
                const idPadreTemtica = otraCapa ? toNumber(otraCapa.IDTEMATICAPADRE) : 0

                const tematica: TreeNode = {
                    ...capaReferencia,
                    IDTEMATICA: id,
                    IDTEMATICAPADRE: idPadreTemtica,
                    URL: '',
                    IDCAPA: 0,
                    TITULOCAPA: '',
                    NOMBRETEMATICA: otraCapa?.NOMBRETEMATICA || capaReferencia.NOMBRETEMATICA,
                    children: []
                }
                tematicaMap.set(id, tematica)

                // Si este padre tiene su propio padre, agregarlo también
                if (idPadreTemtica !== 0 && !idsNecesarios.has(idPadreTemtica)) {
                    idsNecesarios.add(idPadreTemtica)
                }
            }
        })
    }

    // Segunda pasada: establecer jerarquía entre temáticas
    const rootNodes: TreeNode[] = []
    const processedAsChild = new Set<number>()

    // Ordenar temáticas por nivel (padres primero)
    const sortedTematicas = Array.from(tematicaMap.values()).sort((a, b) => {
        const levelA = toNumber(a.IDTEMATICAPADRE) === 0 ? 0 : 1
        const levelB = toNumber(b.IDTEMATICAPADRE) === 0 ? 0 : 1
        return levelA - levelB
    })

    sortedTematicas.forEach(node => {
        const idPadre = toNumber(node.IDTEMATICAPADRE)
        const idTematica = toNumber(node.IDTEMATICA)

        if (idPadre === 0) {
            // Es nodo raíz
            if (!rootNodes.some(r => toNumber(r.IDTEMATICA) === idTematica)) {
                rootNodes.push(node)
            }
        } else {
            // Buscar padre en el mapa
            const parentNode = tematicaMap.get(idPadre)
            if (parentNode) {
                // Verificar que no exista ya como hijo
                const alreadyChild = parentNode.children.some(
                    child => toNumber(child.IDTEMATICA) === idTematica && !hasValidUrl(child)
                )
                if (!alreadyChild) {
                    parentNode.children.push(node)
                    processedAsChild.add(idTematica)
                }
            } else {
                // Crear padre si no existe
                const parentInfo = flatData.find(item => toNumber(item.IDTEMATICA) === idPadre)
                if (parentInfo) {
                    const newParent: TreeNode = {
                        ...parentInfo,
                        IDTEMATICA: idPadre,
                        IDTEMATICAPADRE: toNumber(parentInfo.IDTEMATICAPADRE),
                        URL: '',
                        children: [node]
                    }
                    tematicaMap.set(idPadre, newParent)
                    processedAsChild.add(idTematica)

                    if (toNumber(parentInfo.IDTEMATICAPADRE) === 0) {
                        rootNodes.push(newParent)
                    }
                } else {
                    // No se encontró padre, agregar como raíz
                    if (!rootNodes.some(r => toNumber(r.IDTEMATICA) === idTematica)) {
                        rootNodes.push(node)
                    }
                }
            }
        }
    })

    // Tercera pasada: agregar capas a sus temáticas correspondientes
    capas.forEach(capa => {
        const idPadre = toNumber(capa.IDTEMATICAPADRE)
        const idCapa = toNumber(capa.IDCAPA)
        let parentTematica = tematicaMap.get(idPadre)

        if (parentTematica) {
            // Verificar que no exista ya esta capa
            const exists = parentTematica.children.some(
                child => toNumber(child.IDCAPA) === idCapa && child.URL === capa.URL
            )
            if (!exists) {
                parentTematica.children.push(capa)
            }
        } else if (idPadre === 0) {
            // Es una capa sin temática padre (raíz directa)
            const idTematica = toNumber(capa.IDTEMATICA)
            let grupoCapa = rootNodes.find(
                n => toNumber(n.IDTEMATICA) === idTematica && !hasValidUrl(n)
            )
            if (!grupoCapa) {
                grupoCapa = {
                    ...capa,
                    URL: '',
                    IDCAPA: 0,
                    TITULOCAPA: '',
                    children: []
                }
                rootNodes.push(grupoCapa)
                tematicaMap.set(idTematica, grupoCapa)
            }
            grupoCapa.children.push(capa)
        } else {
            // Crear temática padre si no existe
            const parentInfo = flatData.find(item => toNumber(item.IDTEMATICA) === idPadre)
            if (parentInfo) {
                parentTematica = {
                    ...parentInfo,
                    IDTEMATICA: idPadre,
                    IDTEMATICAPADRE: toNumber(parentInfo.IDTEMATICAPADRE),
                    URL: '',
                    children: [capa]
                }
                tematicaMap.set(idPadre, parentTematica)

                const idAbuelo = toNumber(parentInfo.IDTEMATICAPADRE)
                if (idAbuelo === 0) {
                    if (!rootNodes.some(r => toNumber(r.IDTEMATICA) === idPadre)) {
                        rootNodes.push(parentTematica)
                    }
                } else {
                    const grandParent = tematicaMap.get(idAbuelo)
                    if (grandParent) {
                        const alreadyChild = grandParent.children.some(
                            child => toNumber(child.IDTEMATICA) === idPadre && !hasValidUrl(child)
                        )
                        if (!alreadyChild) {
                            grandParent.children.push(parentTematica)
                        }
                    } else {
                        if (!rootNodes.some(r => toNumber(r.IDTEMATICA) === idPadre)) {
                            rootNodes.push(parentTematica)
                        }
                    }
                }
            } else {
                // Si no hay información del padre, agregar capa como raíz
                rootNodes.push(capa)
            }
        }
    })

    return rootNodes
}

interface Widget_Tree_Props {
    dataTablaContenido: ItemResponseTablaContenido[]; // data plana del servicio
    varJimuMapView: JimuMapView; // referencia al mapa
    setDataTablaContenido: Dispatch<SetStateAction<ItemResponseTablaContenido[]>> //  por el momento cuando se ajusta el VISIBLE de cada capa
}

/**
 * Widget que se encarga de renderizar la data ya ordenada de la tabla de contenido en forma de arbol
 * @author Rigoberto Rios - rigoriosh@gmail.com
 * @param param0 segun interfac Widget_Tree_Props
 * @returns Widget_Tree
 */
const WidgetTree: React.FC<Widget_Tree_Props> = ({ dataTablaContenido, varJimuMapView, setDataTablaContenido }) => {
    const [expandedItems, setExpandedItems] = useState({}) // almacena los nodos que son expandibles
    const [checkedItems, setCheckedItems] = useState({}) // almacena los nodos que tienen la opcion de check y son checkeados
    const [searchQuery, setSearchQuery] = useState<string>('') // se utiliza para capturar la entrada del campo buscar capa
    const [capasSelectd, setCapasSelectd] = useState<ItemResponseTablaContenido[]>([]) // almacena las capas seleccionadas, se emplea para ser renderizadas en el tab "Orden Capas"
    const [contextMenu, setContextMenu] = useState<InterfaceContextMenu>(null) // controla el despliegue y data a mostrar en el contextMenu
    const [featuresLayersDeployed, setFeaturesLayersDeployed] = useState<InterfaceFeaturesLayersDeployed[]>([]) // almacena los features y su metadata pintados en el mapa
    const [banderaRefreshCapas, setBanderaRefreshCapas] = useState<boolean>(false) // bandera empleada para actualizar en el mapa el orden de las capas
    const [utilsModule, setUtilsModule] = useState<any>(null)


    /**
     * Metodo que prende o apaga la capa a la que se le de click en el check y actualiza capasSelectd, checkedItems
     * Solo se puede chequear capas que tienen URL (nivel más bajo del árbol)
     * @param capa de tipo TreeNode
     */
    const handleCheck = (capa: TreeNode, {target}) => {
        if (!capa.URL) return // Solo procesar capas con URL

        const IDCAPA = capa.IDCAPA
        setCheckedItems(prevState => ({ ...prevState, [IDCAPA]: target.checked }))
        capa.VISIBLE = target.checked

        if (utilsModule?.logger()) console.log("handleCheck =>", {capa, target, IDCAPA})

        if (capasSelectd.length > 0 || target.checked) {
            setCapasSelectd(prevState => {
                const exists = prevState.find(item => item.IDCAPA === capa.IDCAPA)
                const newState = exists
                    ? prevState.filter(item => item.IDCAPA !== capa.IDCAPA)
                    : [...prevState, capa]
                return newState
            })
            target.checked ? dibujaCapasSeleccionadas([capa], varJimuMapView) : removerFeatureLayer(capa)
        }
    }

    /**
     * Metodo que controla el click derecho sobre una capa especifica para abrir el contextMenu
     * Solo se muestra para capas con URL (nivel más bajo del árbol)
     * @param e evento click
     * @param capa capa seleccionada (TreeNode)
     */
    const handleRightClick = (e: React.MouseEvent<HTMLDivElement>, capa: TreeNode) => {
        e.preventDefault()
        // Solo mostrar context menu para capas con URL
        if (capa.URL) {
            setContextMenu({
                mouseX: e.clientX + 50,
                mouseY: e.clientY - 70,
                capa_Feature: {
                    capa: capa,
                    layer: featuresLayersDeployed.find(e => e.capa.IDCAPA === capa.IDCAPA)?.layer
                }
            })
        }
    }

    /**
     * Metodo que se encarga de dibujar el arbol de capas
     * Usa la estructura TreeNode con children para niveles jerárquicos
     * @param param0
     * @returns
     */
    const Nodo = ({ capa, level = 0, isLast = false }: { capa: TreeNode, level?: number, isLast?: boolean }) => {
        // Crear key único para expandir: usar combinación de IDTEMATICA e IDCAPA
        const nodeKey = capa.URL ? `${capa.IDTEMATICA}_${capa.IDCAPA}` : `tematica_${capa.IDTEMATICA}`
        const isExpanded = expandedItems[nodeKey]

        // Tiene hijos si children tiene elementos
        const hasChildren = capa.children && capa.children.length > 0

        // Es una capa chequeable si tiene URL (es el nivel más bajo del árbol)
        const isCheckable = !!capa.URL

        // El identificador para el check es IDCAPA para capas con URL
        const checkId = capa.IDCAPA

        // Mostrar TITULOCAPA si es capa con URL, sino NOMBRETEMATICA
        const displayName = isCheckable ? (capa.TITULOCAPA || capa.NOMBRETEMATICA) : capa.NOMBRETEMATICA

        const renderChildren = () => (
            <div className="tree-children">
                {capa.children && capa.children.map((child, index) => (
                    <Nodo
                        key={child.URL ? `${child.IDTEMATICA}_${child.IDCAPA}_${index}` : `tematica_${child.IDTEMATICA}_${index}`}
                        capa={child}
                        level={level + 1}
                        isLast={index === capa.children.length - 1}
                    />
                ))}
            </div>
        )

        return (
            <div
                className={`tree-node ${level > 0 ? 'tree-node-child' : ''} ${isLast ? 'tree-node-last' : ''}`}
                onContextMenu={(e) => { handleRightClick(e, capa) }}
            >
                <div className={`tree-node-content ${isCheckable ? 'tree-node-layer' : 'tree-node-folder'} ${checkedItems[checkId] ? 'tree-node-checked' : ''}`}>
                    {/* Línea de conexión vertical */}
                    {level > 0 && <span className="tree-line-horizontal"></span>}

                    {/* Icono de expandir/colapsar */}
                    <span
                        /* className={`tree-toggle ${hasChildren ? 'tree-toggle-clickable' : 'tree-toggle-spacer'}`} */
                        onClick={() => { if (hasChildren) setExpandedItems(prevState => ({ ...prevState, [nodeKey]: !prevState[nodeKey]})) }}
                    >
                        {hasChildren ? (
                            isExpanded ? <DownOutlined className="tree-icon" /> : <RightOutlined className="tree-icon" />
                        ) : (
                            <span className="tree-icon-dot"></span>
                        )}
                    </span>

                    {/* Checkbox para capas */}
                    {isCheckable && (
                        <input
                            type="checkbox"
                            className="tree-checkbox"
                            checked={!!checkedItems[checkId]}
                            onChange={(e) => { handleCheck(capa, e) }}
                        />
                    )}

                    {/* Nombre del nodo */}
                    <span className="tree-node-label" title={displayName}>
                        {displayName}
                    </span>
                </div>

                {/* Hijos con animación */}
                {isExpanded && hasChildren && renderChildren()}
            </div>
        )
    }

    /**
     * Metodo encargado de filtrar las capas que coinciden con el campo de busqueda
     * Usa la estructura TreeNode con children
     * @param treeData Árbol jerárquico de nodos
     * @returns Árbol filtrado con resultados de búsqueda
     */
    const filterTreeData = (treeData: TreeNode[]): TreeNode[] => {
        if (searchQuery === '') {
            return treeData
        }

        const matchingLayers: TreeNode[] = []

        // Función recursiva para buscar capas que coincidan
        const searchRecursive = (nodes: TreeNode[]) => {
            for (const node of nodes) {
                // Si es una capa con URL y coincide con la búsqueda
                if (node.URL && node.TITULOCAPA?.toLowerCase().includes(searchQuery.toLowerCase())) {
                    matchingLayers.push({ ...node, children: [] })
                }
                // Buscar en los hijos
                if (node.children && node.children.length > 0) {
                    searchRecursive(node.children)
                }
            }
        }

        searchRecursive(treeData)

        // Crear nodo contenedor para resultados
        const resultNode: TreeNode = {
            IDTEMATICA: 555,
            IDTEMATICAPADRE: 0,
            NOMBRETEMATICA: 'Resultado de tu búsqueda',
            TITULOCAPA: '',
            URL: '',
            IDCAPA: 0,
            ATRIBUTO: '',
            DESCRIPCIONSERVICIO: '' as any,
            METADATOCAPA: '',
            METADATOSERVICIO: '',
            NOMBRECAPA: '',
            URLSERVICIOWFS: '',
            VISIBLE: false,
            children: matchingLayers
        }

        return [resultNode]
    }

    /**
     * Recibe la data plana de la tabla de contenido, construye el árbol jerárquico,
     * aplica filtro de búsqueda y renderiza los nodos
     * @param dataTablaContenido Data plana del servicio
     * @returns componente Nodo con la estructura jerárquica
     */
    const renderTree = (dataTablaContenido: ItemResponseTablaContenido[]) => {
        if (!dataTablaContenido || dataTablaContenido.length < 1) return null

        // Construir árbol jerárquico a partir de data plana
        const treeData = buildTree(dataTablaContenido)

        // Log para depuración - ver estructura del árbol generado
        if (utilsModule?.logger()) {
            console.log("=== buildTree resultado ===")
            console.log("Nodos raíz:", treeData.length)
            const logTree = (nodes: TreeNode[], nivel = 0) => {
                nodes.forEach(n => {
                    const indent = "  ".repeat(nivel)
                    const tipo = n.URL ? "(CAPA)" : "(TEMATICA)"
                    console.log(`${indent}${tipo} ID:${n.IDTEMATICA} Padre:${n.IDTEMATICAPADRE} - ${n.NOMBRETEMATICA || n.TITULOCAPA} [hijos: ${n.children?.length || 0}]`)
                    if (n.children && n.children.length > 0) {
                        logTree(n.children, nivel + 1)
                    }
                })
            }
            logTree(treeData)
        }

        // Aplicar filtro de búsqueda
        const filteredTree = filterTreeData(treeData)

        return (
            <div className="tree-root">
                {filteredTree.map((node: TreeNode, index: number) => (
                    <Nodo
                        key={node.URL ? `${node.IDTEMATICA}_${node.IDCAPA}_${index}` : `tematica_${node.IDTEMATICA}_${index}`}
                        capa={node}
                        isLast={index === filteredTree.length - 1}
                    />
                ))}
            </div>
        )
    }

    /**
     * Metodo que dibuja en el mapa la capa chequeada y actualiza el state FeaturesLayersDeployed
     * Solo procesa capas con URL (nivel más bajo del árbol)
     * @param capasToRender Array de TreeNode con URL
     * @param varJimuMapView Referencia al mapa
     */
    const dibujaCapasSeleccionadas = (capasToRender: TreeNode[], varJimuMapView: JimuMapView) => {
        if (utilsModule?.logger()) console.log("dibujaCapasSeleccionadas:", {capasToRender})

        capasToRender.forEach(capa => {
            if (!capa.URL) return // Solo procesar capas con URL

            const layer = new FeatureLayer({
                url: `${capa.URL}/${capa.NOMBRECAPA}`
            })
            varJimuMapView.view.map.add(layer)

            setFeaturesLayersDeployed(features => [...features, { capa, layer }])
        })
    }

    /**
     * Metodo que quita del mapa una capa deschequeada y actualiza el state FeaturesLayersDeployed
     * @param capa TreeNode con URL a remover
     */
    const removerFeatureLayer = (capa: TreeNode) => {
        if (featuresLayersDeployed.length > 0 && capa.IDCAPA) {
            const featureToRemove = featuresLayersDeployed.find(
                ({capa: capaDeployed}) => capaDeployed.IDCAPA === capa.IDCAPA
            )

            if (featureToRemove) {
                varJimuMapView.view.map.remove(featureToRemove.layer)
                setFeaturesLayersDeployed(
                    featuresLayersDeployed.filter(item => item.capa.IDCAPA !== capa.IDCAPA)
                )
                varJimuMapView.view.zoom = varJimuMapView.view.zoom - 0.00000001
            }
        }
    }

    /**
     * Metodo que quita todas las capas pintadas en el mapa y actauliza los states FeaturesLayersDeployed, apasSelectd,
     * DataTablaContenido y SearchQuery
     * @returns
     */
    const removeAllLayers = () => {
        featuresLayersDeployed.forEach(FL => varJimuMapView.view.map.remove(FL.layer))
        setFeaturesLayersDeployed([])
        const {capasVisibles, clonedDataTablaContenido, apagarCapas} = recorreTodasLasCapasTablaContenido(dataTablaContenido, true)
        setCapasSelectd( capasVisibles )
        if (apagarCapas) setDataTablaContenido(clonedDataTablaContenido)
        varJimuMapView.view.zoom = varJimuMapView.view.zoom - 0.00000001
        renderTree(dataTablaContenido)
        setSearchQuery('')
        setCheckedItems({})// con esto se descelecciona los check activos
        setExpandedItems({}) // con esto se cierran todos los item abiertes, se descolacza el arbol
        // renderTree(dataTablaContenido);
    }

    /**
     * Se encarga de reordenar las capas dibujadas en el mapa segun lo modificado en el tab Orden Capas
     * @param param0
     */
    const reorderLayers = ({view}) => {
        let toChangeFeaturesLayersDeployed = featuresLayersDeployed
        const layersMap = view.map.allLayers.toArray()
        const ordenCapas=[]
        layersMap.forEach((layerMap: { id: string; }, item: number) => {
            let existeEnFeaturesLayersDeployed = false
            toChangeFeaturesLayersDeployed.forEach(FeaLayerDep => {
                if (layerMap.id === FeaLayerDep.layer.id) {
                    existeEnFeaturesLayersDeployed = true
                }
            })
            if (!existeEnFeaturesLayersDeployed) {
                ordenCapas.push({
                    position: item,
                    layerMap
                })
            }
        })
        const nuevoOrden=[]
        layersMap.forEach((lyrMp: any, item: number) => {
            let existePosicion = false
            ordenCapas.forEach(ordeCapa => {
                if (item === ordeCapa.position) {
                    nuevoOrden.push(ordeCapa.layerMap)
                    existePosicion = true
                }
            })
            if (!existePosicion) {
                nuevoOrden.push(toChangeFeaturesLayersDeployed[0].layer)
                toChangeFeaturesLayersDeployed = toChangeFeaturesLayersDeployed.slice(1)
            }
        })
        nuevoOrden.forEach( (layer, i) => view.map.reorder(layer,i))
        // Forzar la actualización de la vista del mapa
        // view.refresh();  // Esta línea fuerza la actualización de la vista del mapa
        view.zoom = view.zoom -0.00000001
    }

    /**
     * Recorre la tabla de contenido en buscas de capas a dibujar por el parametro VISIBLE = true y las dibuja
     */
    useEffect(() => {
        console.log({dataTablaContenido})
        if (dataTablaContenido.length > 0) {
            const {capasVisibles} = recorreTodasLasCapasTablaContenido(dataTablaContenido)
            setCapasSelectd( capasVisibles )
            dibujaCapasSeleccionadas(capasVisibles, varJimuMapView)
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataTablaContenido])

    /**
     * Detecta cambio en banderaRefreshCapas y ejecuta la logia reorderLayers siempre y cuando exista la referencia del mapa
     */
    useEffect(() => {

        if (varJimuMapView) {
            reorderLayers(varJimuMapView)
        }


    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [banderaRefreshCapas])

    useEffect(() => {
        import('../../../../utils/module').then(modulo => { setUtilsModule(modulo) })
    }, [])

    return (
        <div style={{height:'inherit'}}>
             {/* <button type="button" onClick={showState}>GetState</button> */}
            <Tabs>
                <TabList>
                    <Tab>Lista de Indicadores</Tab>
                    {
                        capasSelectd.length>0 && <Tab>Orden de Indicadores</Tab>
                    }
                </TabList>

                <TabPanel>
                    <div className="tree-container" onClick={()=>{ setContextMenu(null) }}>
                        <div className="search-bar">

                            <input
                                type="text"
                                placeholder="Buscar capas..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value) }}
                                className='input-search'
                            />
                            <div className='btnsSearch'>
                                <Button onClick={()=>{ setSearchQuery('') }} size="sm" type="secondary" >
                                        <ClearOutlined />
                                </Button>
                                {
                                    capasSelectd.length>0 &&
                                        <Button onClick={()=>{ removeAllLayers() }} size="sm" type="secondary" >
                                            <WrongOutlined />
                                        </Button>
                                }

                            </div>
                        </div>
                        <div >
                            { renderTree(dataTablaContenido)}
                        </div>
                    </div>
                </TabPanel>
                {
                    capasSelectd.length>0 &&
                        <TabPanel>
                            <div className="checked-layers tab-order-capas">
                                <DragAndDrop items={featuresLayersDeployed} setItems={setFeaturesLayersDeployed} setBanderaRefreshCapas={setBanderaRefreshCapas}/>
                            </div>
                        </TabPanel>
                }
            </Tabs>
            <ContexMenu contextMenu={contextMenu} setContextMenu={setContextMenu} varJimuMapView={varJimuMapView}/>

        </div>
    )
}
export default WidgetTree

/**
 * Busca las capas que tienen la propiedad @VISIBLE para ser visualizadas en el Tab "Orden Capas"
 * Trabaja con la estructura plana de datos del servicio
 * @param dataTablaContenido Array plano de datos
 * @param apagarCapas Si es true, apaga todas las capas visibles
 */
const recorreTodasLasCapasTablaContenido = (dataTablaContenido: ItemResponseTablaContenido[], apagarCapas: boolean = false) => {
    const capasVisibles: ItemResponseTablaContenido[] = []
    const clonedDataTablaContenido: ItemResponseTablaContenido[] = JSON.parse(JSON.stringify(dataTablaContenido))

    clonedDataTablaContenido.forEach(capa => {
        // Solo procesar capas con URL (nivel más bajo del árbol)
        if (capa.URL) {
            if (capa.VISIBLE && apagarCapas) {
                capa.VISIBLE = false
            }
            if (capa.VISIBLE && !apagarCapas) {
                capasVisibles.push(capa)
            }
        }
    })

    return { capasVisibles, clonedDataTablaContenido, apagarCapas }
}