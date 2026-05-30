import React, { useState, useCallback, useRef, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Save, Play, MessageSquare, Maximize, Menu, ChevronLeft } from 'lucide-react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TriggerNode from './Nodes/TriggerNode';
import TextMessageNode from './Nodes/TextMessageNode';

const nodeTypes = {
    trigger: TriggerNode,
    textMessage: TextMessageNode,
};

let idCounter = 0;
const getId = () => `node_${Date.now()}_${idCounter++}`;

export default function Editor({ auth, flow }) {
    const reactFlowWrapper = useRef(null);
    
    // Parse flow_data or set defaults
    const initialNodes = flow.flow_data?.nodes || [];
    const initialEdges = flow.flow_data?.edges || [];

    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);
    const [isSaving, setIsSaving] = useState(false);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const editorContainerRef = useRef(null);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            if (editorContainerRef.current) {
                editorContainerRef.current.requestFullscreen().catch(err => {
                    console.log("Error entering fullscreen", err);
                });
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const onNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );
    const onEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );
    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { strokeWidth: 2 } }, eds)),
        []
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            if (!reactFlowInstance) return;

            const type = event.dataTransfer.getData('application/reactflow/type');
            const label = event.dataTransfer.getData('application/reactflow/label');

            if (typeof type === 'undefined' || !type) return;

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode = {
                id: getId(),
                type,
                position,
                data: { label: label, isValid: false },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance]
    );

    const onSave = () => {
        setIsSaving(true);
        if (reactFlowInstance) {
            const flowData = reactFlowInstance.toObject();
            router.put(route('visual-flows.update', flow.id), {
                flow_data: flowData
            }, {
                preserveScroll: true,
                onSuccess: () => setIsSaving(false),
                onError: () => setIsSaving(false),
            });
        }
    };

    const Sidebar = () => {
        const onDragStart = (event, nodeType, label) => {
            event.dataTransfer.setData('application/reactflow/type', nodeType);
            event.dataTransfer.setData('application/reactflow/label', label);
            event.dataTransfer.effectAllowed = 'move';
        };

        return (
            <aside className={`bg-white border-r border-slate-200 flex flex-col h-full z-10 shadow-lg transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-0 overflow-hidden border-r-0'}`}>
                <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center whitespace-nowrap">
                    <h3 className="font-semibold text-slate-800">Componentes Disponibles</h3>
                    <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100" title="Ocultar componentes">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-4 flex-grow overflow-y-auto space-y-6">
                    {/* Basic Messages */}
                    <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Mensajes Básicos</h4>
                        <div className="space-y-3">
                            <div 
                                className="bg-white border border-slate-200 shadow-sm text-slate-700 text-sm py-3 px-4 rounded-lg cursor-grab hover:shadow-md hover:border-purple-300 transition flex items-center group relative overflow-hidden"
                                onDragStart={(e) => onDragStart(e, 'trigger', 'Disparador Inicial')}
                                draggable
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 opacity-80 group-hover:opacity-100"></div>
                                <div className="bg-purple-50 text-purple-600 p-1.5 rounded mr-3 border border-purple-100">
                                    <Play className="w-4 h-4" />
                                </div>
                                <span className="font-medium">Disparador Inicial</span>
                            </div>

                            <div 
                                className="bg-white border border-slate-200 shadow-sm text-slate-700 text-sm py-3 px-4 rounded-lg cursor-grab hover:shadow-md hover:border-blue-300 transition flex items-center group relative overflow-hidden"
                                onDragStart={(e) => onDragStart(e, 'textMessage', 'Mensaje de Texto')}
                                draggable
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-80 group-hover:opacity-100"></div>
                                <div className="bg-blue-50 text-blue-600 p-1.5 rounded mr-3 border border-blue-100">
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                <span className="font-medium">Mensaje de Texto</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Placeholders for future nodes */}
                    <div className="opacity-50">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Contenido Interactivo</h4>
                        <div className="space-y-3">
                            <div className="bg-slate-50 border border-slate-200 text-slate-400 text-sm py-3 px-4 rounded-lg flex items-center cursor-not-allowed">
                                Mensaje con Botones (Próximamente)
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        );
    };

    return (
        <AuthenticatedLayout user={auth.user} header={null} fullWidth={true}>
            <Head title={`Editor: ${flow.name}`} />

            <div ref={editorContainerRef} className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-50">
                <Sidebar />
                <div className="flex-grow relative h-full w-full" ref={reactFlowWrapper}>
                    {/* Floating Header Actions */}
                    <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
                        <div className="flex items-center gap-3 pointer-events-auto">
                            {!isSidebarOpen && (
                                <button 
                                    onClick={() => setIsSidebarOpen(true)} 
                                    className="bg-white p-2.5 rounded-lg shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center group"
                                    title="Mostrar Componentes"
                                >
                                    <Menu className="w-4 h-4 text-slate-400 group-hover:text-slate-600 mr-2" />
                                    <span className="text-sm font-semibold">Componentes</span>
                                </button>
                            )}
                            <button 
                                onClick={toggleFullscreen}
                                className="bg-white px-3 py-2.5 rounded-lg shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium flex items-center gap-2 transition-all"
                            >
                                <Maximize className="w-4 h-4" /> 
                                <span className="hidden sm:inline">{isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}</span>
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-4 pointer-events-auto">
                            <span className="hidden md:inline font-semibold text-slate-700 bg-white/90 px-4 py-2 rounded-lg backdrop-blur-sm shadow-sm border border-slate-200">
                                {flow.name}
                            </span>
                            <button
                                onClick={onSave}
                                disabled={isSaving}
                                className="inline-flex items-center px-5 py-2.5 bg-blue-600 border border-transparent rounded-lg font-semibold text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50 shadow-sm"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Guardando...' : 'Guardar Flujo'}
                            </button>
                        </div>
                    </div>

                    <ReactFlowProvider>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onInit={setReactFlowInstance}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            nodeTypes={nodeTypes}
                            fitView
                        >
                            <Background color="#e2e8f0" gap={16} size={1} />
                            <Controls className="!bottom-4 !left-4 !right-auto bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden" />
                            <MiniMap 
                                nodeStrokeWidth={3} 
                                className="!bottom-4 !right-4 bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden hidden sm:block" 
                            />
                        </ReactFlow>
                    </ReactFlowProvider>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
