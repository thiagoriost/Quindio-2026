import React, { useState, useEffect } from 'react'
import { FaChevronRight, FaChevronDown, FaSearch, FaTimes } from 'react-icons/fa'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import 'rc-slider/assets/index.css'
import Slider from 'rc-slider'
import '../styles/style.css'
import type { ItemResponseTablaContenido, Tematicas } from '../../types/interfaces'
import FeatureLayer from "esri/layers/FeatureLayer"

const Widget_Tree = ({ dataTablaContenido, varJimuMapView }) => {
    const [expandedItems, setExpandedItems] = useState({})
    const [checkedItems, setCheckedItems] = useState({})
    const [searchQuery, setSearchQuery] = useState('')
    const [capasSelectd, setCapasSelectd] = useState<ItemResponseTablaContenido[]>([])
    const [contextMenu, setContextMenu] = useState(null)

    const handleExpandCollapse = (id) => {
        setExpandedItems(prevState => ({
            ...prevState,
            [id]: !prevState[id],
        }))
    }

    const handleCheck = (capa: ItemResponseTablaContenido) => {
        const IDCAPA = capa.capasNietas ? capa.capasNietas[0].IDCAPA : capa.IDCAPA
        setCheckedItems(prevState => ({
            ...prevState,
            [IDCAPA]: !prevState[IDCAPA],
        }))
        setCapasSelectd(prevState => {
            const newState = prevState.includes(capa) ? prevState.filter(item => item !== capa) : [...prevState, capa]
            return newState
        })

        const layer = new FeatureLayer({
            outFields: ["*"],
            url: capa.URL
        })
        varJimuMapView.view.map.add(layer)
    }

    const handleReset = () => {
        setSearchQuery('')
    }

    const handleRightClick = (e, capa) => {
        e.preventDefault()
        if (capa.URL) {
            setContextMenu({
                mouseX: e.clientX - 2,
                mouseY: e.clientY - 4,
                capa: capa
            })
        }
    }

    const handleCloseContextMenu = () => {
        setContextMenu(null)
    }

    const Nodo = ({ capa, level = 0 }) => {
        const isExpanded = expandedItems[capa.IDTEMATICA]
        const hasChildren =
            (capa.capasHijas?.length >= 1) ||
            (capa.capasNietas?.length > 0 && capa.IDTEMATICAPADRE > 0) ||
            (capa.capasBisnietos?.length >= 1)

        const isChecked = capa.capasNietas ? capa.capasNietas[0].IDCAPA : capa.IDCAPA

        const displayName = ((capa.capasHijas?.length >= 1)
            || (capa.capasNietas?.length > 1)
            || (capa.capasBisnietos?.length >= 1)
            || (capa.IDTEMATICAPADRE > 0 && !capa.URL))
            ? capa.NOMBRETEMATICA
            : capa.TITULOCAPA

        const renderChildren = () => (
            <>
                {capa.capasHijas && capa.capasHijas.map(capa => (
                    <Nodo key={capa.IDTEMATICA} capa={capa} level={level + 1} />
                ))}
                {capa.capasNietas && capa.capasNietas.map(capa => (
                    <Nodo key={capa.IDTEMATICA} capa={capa} level={level + 1} />
                ))}
                {capa.capasBisnietos && capa.capasBisnietos.map(capa => (
                    <Nodo key={capa.IDTEMATICA} capa={capa} level={level + 1} />
                ))}
            </>
        )

        return (
            <div style={{ marginLeft: level * 20 + 'px' }} onContextMenu={(e) => { handleRightClick(e, capa) }}>
                <div>
                    <span onClick={() => { handleExpandCollapse(capa.IDTEMATICA) }} style={{ cursor: 'pointer' }}>
                        {hasChildren ? (isExpanded ? <FaChevronDown /> : <FaChevronRight />) : null}
                    </span>
                    {
                        ((capa.URL || (capa.capasNietas?.length < 2 && capa.IDTEMATICAPADRE === 0))) ? (
                            <input
                                type="checkbox"
                                checked={!!checkedItems[isChecked]}
                                onChange={() => { handleCheck(capa) }}
                            />
                        ) : null
                    }
                    {displayName}
                </div>
                {isExpanded && hasChildren && renderChildren()}
            </div>
        )
    }

    const filterdataTablaContenido = (dataTablaContenido: Tematicas[]) => {
        if (searchQuery === '') {
            return dataTablaContenido
        }

        const filtereddataTablaContenido = [
            {
                IDTEMATICA: 555,
                IDTEMATICAPADRE: 0,
                NOMBRETEMATICA: 'Resultado de tu busqueda',
                TITULOCAPA: '',
                capasHijas: []
            }
        ]

        const capasHijas = []

        const filtroRecursivo = (dataTablaContenido, searchQuery) => {
            for (const capa of dataTablaContenido) {
                if (capa.URL && capa.TITULOCAPA.toLowerCase().startsWith(searchQuery.toLowerCase())) {
                    const existingNode = capasHijas.find(capaHija => capaHija.IDTEMATICA === capa.IDTEMATICA && capaHija.IDTEMATICAPADRE === capa.IDTEMATICAPADRE)

                    if (existingNode) {
                        existingNode.capasNietas.push(capa)
                    } else {
                        capasHijas.push({
                            IDTEMATICA: capa.IDTEMATICA,
                            IDTEMATICAPADRE: capa.IDTEMATICAPADRE,
                            NOMBRETEMATICA: capa.NOMBRETEMATICA,
                            TITULOCAPA: capa.TITULOCAPA,
                            capasNietas: [capa]
                        })
                    }
                }

                if (capa.capasHijas) {
                    filtroRecursivo(capa.capasHijas, searchQuery)
                }
                if (capa.capasNietas) {
                    filtroRecursivo(capa.capasNietas, searchQuery)
                }
                if (capa.capasBisnietos) {
                    filtroRecursivo(capa.capasBisnietos, searchQuery)
                }
            }
        }

        filtroRecursivo(dataTablaContenido, searchQuery)
        filtereddataTablaContenido[0].capasHijas = capasHijas

        return filtereddataTablaContenido
    }

    const renderTree = (dataTablaContenido: Tematicas[]) => {
        const filteredDataTablaContenido = filterdataTablaContenido(dataTablaContenido)
        return filteredDataTablaContenido.map((capa: Tematicas) => (
            <Nodo key={capa.IDTEMATICA} capa={capa} />
        ))
    }

    const recorreTodasLasCapasTablaContenido = (dataTablaContenido: Tematicas[]) => {
        const capasVisibles: ItemResponseTablaContenido[] = []

        const bucleRecursivo = (dataTablaContenido) => {
            for (const capa of dataTablaContenido) {
                if (capa.URL && capa.VISIBLE) {
                    capasVisibles.push(capa)
                }
                if (capa.capasHijas) {
                    bucleRecursivo(capa.capasHijas)
                }
                if (capa.capasNietas) {
                    bucleRecursivo(capa.capasNietas)
                }
                if (capa.capasBisnietos) {
                    bucleRecursivo(capa.capasBisnietos)
                }
            }
        }

        bucleRecursivo(dataTablaContenido)
        setCapasSelectd(capasVisibles)
    }

    useEffect(() => {
        recorreTodasLasCapasTablaContenido(dataTablaContenido)
    }, [dataTablaContenido])


    return (
        <>
            <Tabs>
                <TabList>
                    <Tab>Tabla de contenido</Tab>
                    <Tab>Orden Capas</Tab>
                </TabList>

                <TabPanel>
                    <div className="tree-container" style={{ maxHeight: '500px', overflowY: 'auto', padding: '20px', backgroundColor: '#FEFFD2', color: '#FF7D29' }}>
                        <div className="search-bar" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                            <FaSearch style={{ marginRight: '10px' }} />
                            <input
                                type="text"
                                placeholder="Buscar capas..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value) }}
                                style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                            <button onClick={handleReset} style={{ marginLeft: '10px', padding: '5px 10px', borderRadius: '4px', border: 'none', backgroundColor: '#007bff', color: 'white', cursor: 'pointer' }}>
                                <FaTimes />
                            </button>
                        </div>
                        <div>
                            { renderTree(dataTablaContenido)}
                        </div>
                    </div>
                </TabPanel>
                <TabPanel>
                    <div className="checked-layers" style={{ padding: '20px', backgroundColor: '#f8f9fa', color: '#FF7D29' }}>
                        <h2>Capas seleccionadas</h2>
                        <ul>
                            {capasSelectd.map(capa => (
                                <li key={capa.IDCAPA}>{capa.NOMBRETEMATICA} - {capa.TITULOCAPA}</li>
                            ))}
                        </ul>
                    </div>
                </TabPanel>
            </Tabs>
            {contextMenu && (
                <div
                    style={{
                        position: 'absolute',
                        top: contextMenu.mouseY,
                        left: contextMenu.mouseX,
                        backgroundColor: 'white',
                        boxShadow: '0px 0px 10px rgba(0,0,0,0.1)',
                        zIndex: 1000,
                        padding: '10px',
                        borderRadius: '5px',
                    }}
                >
                    <Slider defaultValue={30} />
                    {/* Aquí puedes añadir más opciones del menú */}
                    <button onClick={handleCloseContextMenu}>Cerrar</button>
                </div>
            )}
        </>
    )
}

export default Widget_Tree
