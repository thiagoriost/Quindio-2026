/**
 * @fileoverview Componente principal del árbol de capas.
 * Transforma datos planos en estructura jerárquica y renderiza el árbol interactivo.
 *
 * @module tablaContenido4/components/widgetTree
 * @requires react
 * @requires jimu-arcgis
 * @requires @arcgis/core/layers/FeatureLayer
 */

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
 * Construye un árbol jerárquico a partir de un array plano de datos.
 * Esta es la función principal que transforma la data del servicio en estructura de árbol.
 *
 * **Lógica de construcción del árbol:**
 * 1. Separa elementos en TEMÁTICAS (sin URL) y CAPAS (con URL)
 * 2. Las temáticas se organizan jerárquicamente usando IDTEMATICA e IDTEMATICAPADRE
 * 3. Las capas se agrupan por IDTEMATICA:
 *    - Si hay múltiples capas con el mismo IDTEMATICA, se crea un nivel intermedio (grupo)
 *    - Si hay una sola capa, se agrega directamente
 * 4. Elementos con IDTEMATICAPADRE = 0 son nodos raíz
 *
 * @param {ItemResponseTablaContenido[]} flatData - Array plano de datos del servicio
 * @returns {TreeNode[]} Array de nodos raíz con estructura jerárquica (children)
 *
 * @example
 * // Entrada (datos planos con múltiples capas del mismo IDTEMATICA):
 * [{IDTEMATICA: 1, IDTEMATICAPADRE: 0, URL: '', NOMBRETEMATICA: 'Ambiental'},
 *  {IDTEMATICA: 2, IDTEMATICAPADRE: 1, URL: 'http://rios', TITULOCAPA: 'Rios', NOMBRETEMATICA: 'Hidrografía'},
 *  {IDTEMATICA: 2, IDTEMATICAPADRE: 1, URL: 'http://lagos', TITULOCAPA: 'Lagos', NOMBRETEMATICA: 'Hidrografía'}]
 *
 * // Salida (jerárquica con grupo intermedio):
 * [{IDTEMATICA: 1, NOMBRETEMATICA: 'Ambiental', children: [
 *    {IDTEMATICA: 2, NOMBRETEMATICA: 'Hidrografía', URL: '', children: [
 *      {IDTEMATICA: 2, TITULOCAPA: 'Rios', URL: 'http://rios', children: []},
 *      {IDTEMATICA: 2, TITULOCAPA: 'Lagos', URL: 'http://lagos', children: []}
 *    ]}
 * ]}]
 *
 * @author IGAC - DIP
 * @since 2024
 */
const buildTree = (flatData: ItemResponseTablaContenido[], utilsModule): TreeNode[] => {
    console.log({flatData})
    if (!flatData || flatData.length === 0) return []

    // Mapa para acceso rápido por IDTEMATICA
    const tematicaMap = new Map<number, TreeNode>()
    // Array para almacenar capas (elementos con URL)
    const capas: TreeNode[] = []


    /**
     * Normaliza un valor a número.
     * @param {any} val - Valor a normalizar
     * @returns {number} Número normalizado o 0 si no es válido
     */
    const toNumber = (val: any): number => {
        if (val === null || val === undefined) return 0
        const num = Number(val)
        return isNaN(num) ? 0 : num
    }

    /**
     * Verifica si un elemento tiene URL válida (es una capa).
     * @param {ItemResponseTablaContenido} item - Elemento a verificar
     * @returns {boolean} true si tiene URL válida
     */
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

    // Tercera pasada: agrupar capas por IDTEMATICA
    // Si hay múltiples capas con el mismo IDTEMATICA, crear un nivel intermedio
    const capasPorTematica = new Map<number, TreeNode[]>()

    capas.forEach(capa => {
        const idTematica = toNumber(capa.IDTEMATICA)
        if (!capasPorTematica.has(idTematica)) {
            capasPorTematica.set(idTematica, [])
        }
        capasPorTematica.get(idTematica).push(capa)
    })

    // Cuarta pasada: agregar capas/grupos a sus temáticas correspondientes
    capasPorTematica.forEach((capasDelGrupo, idTematica) => {
        // Obtener el IDTEMATICAPADRE del primer elemento del grupo
        const idPadre = toNumber(capasDelGrupo[0].IDTEMATICAPADRE)
        let parentTematica = tematicaMap.get(idPadre)

        /**
         * Función auxiliar para agregar capas o grupo de capas a un nodo padre.
         * Si hay más de una capa con el mismo IDTEMATICA, crea un nivel intermedio.
         * @param parent Nodo padre donde agregar las capas
         * @param capasAAgregar Array de capas a agregar
         */
        const agregarCapasANodo = (parent: TreeNode, capasAAgregar: TreeNode[]) => {
            if (capasAAgregar.length === 1) {
                // Solo una capa, agregarla directamente
                const capa = capasAAgregar[0]
                const exists = parent.children.some(
                    child => toNumber(child.IDCAPA) === toNumber(capa.IDCAPA) && child.URL === capa.URL
                )
                if (!exists) {
                    parent.children.push(capa)
                }
            } else {
                // Múltiples capas con el mismo IDTEMATICA - crear grupo intermedio
                const primeraCapa = capasAAgregar[0]
                const grupoIntermedio: TreeNode = {
                    ...primeraCapa,
                    IDTEMATICA: idTematica,
                    IDTEMATICAPADRE: idPadre,
                    URL: '', // Sin URL porque es un grupo, no una capa seleccionable
                    IDCAPA: 0,
                    TITULOCAPA: '',
                    NOMBRETEMATICA: primeraCapa.NOMBRETEMATICA || `Grupo ${idTematica}`,
                    children: capasAAgregar.map(c => ({ ...c })) // Clonar las capas como hijos
                }

                // Verificar que no exista ya este grupo
                const existsGrupo = parent.children.some(
                    child => toNumber(child.IDTEMATICA) === idTematica && !hasValidUrl(child) && child.IDCAPA === 0
                )
                if (!existsGrupo) {
                    parent.children.push(grupoIntermedio)
                }
            }
        }

        if (parentTematica) {
            agregarCapasANodo(parentTematica, capasDelGrupo)
        } else if (idPadre === 0) {
            // Es una capa sin temática padre (raíz directa)
            let grupoCapa = rootNodes.find(
                n => toNumber(n.IDTEMATICA) === idTematica && !hasValidUrl(n)
            )
            if (!grupoCapa) {
                const primeraCapa = capasDelGrupo[0]
                grupoCapa = {
                    ...primeraCapa,
                    URL: '',
                    IDCAPA: 0,
                    TITULOCAPA: '',
                    children: []
                }
                rootNodes.push(grupoCapa)
                tematicaMap.set(idTematica, grupoCapa)
            }

            if (capasDelGrupo.length === 1) {
                grupoCapa.children.push(capasDelGrupo[0])
            } else {
                // Agregar todas las capas como hijos individuales del grupo
                capasDelGrupo.forEach(capa => {
                    const exists = grupoCapa.children.some(
                        child => toNumber(child.IDCAPA) === toNumber(capa.IDCAPA) && child.URL === capa.URL
                    )
                    if (!exists) {
                        grupoCapa.children.push(capa)
                    }
                })
            }
        } else {
            // Crear temática padre si no existe
            const parentInfo = flatData.find(item => toNumber(item.IDTEMATICA) === idPadre)
            if (parentInfo) {
                parentTematica = {
                    ...parentInfo,
                    IDTEMATICA: idPadre,
                    IDTEMATICAPADRE: toNumber(parentInfo.IDTEMATICAPADRE),
                    URL: '',
                    children: []
                }
                tematicaMap.set(idPadre, parentTematica)

                agregarCapasANodo(parentTematica, capasDelGrupo)

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
                // Si no hay información del padre, agregar capas como raíz
                if (capasDelGrupo.length === 1) {
                    rootNodes.push(capasDelGrupo[0])
                } else {
                    // Crear grupo para las capas huérfanas
                    const primeraCapa = capasDelGrupo[0]
                    const grupoHuerfano: TreeNode = {
                        ...primeraCapa,
                        IDTEMATICA: idTematica,
                        IDTEMATICAPADRE: 0,
                        URL: '',
                        IDCAPA: 0,
                        TITULOCAPA: '',
                        NOMBRETEMATICA: primeraCapa.NOMBRETEMATICA || `Grupo ${idTematica}`,
                        children: capasDelGrupo
                    }
                    rootNodes.push(grupoHuerfano)
                }
            }
        }
    })
    if (utilsModule?.logger()) console.log({tematicaMap, capas})
    return rootNodes
}

/**
 * Props del componente WidgetTree.
 * @interface Widget_Tree_Props
 */
interface Widget_Tree_Props {
    /** Data plana del servicio (sin jerarquía) */
    dataTablaContenido: ItemResponseTablaContenido[];
    /** Referencia al mapa de Jimu */
    varJimuMapView: JimuMapView;
    /** Setter para actualizar la data (ej: cambiar VISIBLE) */
    setDataTablaContenido: Dispatch<SetStateAction<ItemResponseTablaContenido[]>>;
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
        const treeData = buildTree(dataTablaContenido, utilsModule)

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
        if (utilsModule?.logger()) console.log({dataTablaContenido})
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
                    <Tab>Lista de Indicadores RRH</Tab>
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
 * Busca las capas visibles en la tabla de contenido.
 * Utilizado para inicializar capas con VISIBLE=true y para limpiar todas las capas.
 *
 * @param {ItemResponseTablaContenido[]} dataTablaContenido - Array plano de datos
 * @param {boolean} [apagarCapas=false] - Si es true, apaga todas las capas visibles
 * @returns {Object} Objeto con capasVisibles, clonedDataTablaContenido y apagarCapas
 *
 * @author IGAC - DIP
 * @since 2024
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