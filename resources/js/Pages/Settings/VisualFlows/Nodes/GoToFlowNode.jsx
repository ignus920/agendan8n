import React, { useState, useEffect, useContext } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { LogOut, ChevronDown, ChevronUp, Copy, Trash2, AlertCircle } from 'lucide-react';
import { FlowEditorContext } from '../FlowEditorContext';

export default function GoToFlowNode({ id, data, selected }) {
    const { updateNodeData, getNodes, setNodes } = useReactFlow();
    const { otherFlows = [] } = useContext(FlowEditorContext);
    
    // Default values if data.output doesn't exist
    const initialOutput = data.output?.[0] || { target_flow_id: "" };
    
    const [targetFlowId, setTargetFlowId] = useState(initialOutput.target_flow_id || "");
    const [isExpanded, setIsExpanded] = useState(data.isExpanded !== false);

    const isValid = targetFlowId !== "";

    useEffect(() => {
        updateNodeData(id, {
            ...data,
            isValid,
            isExpanded,
            errorMessage: !isValid ? "Debe seleccionar un flujo destino" : "",
            output: [{ target_flow_id: targetFlowId }]
        });
    }, [targetFlowId, isExpanded]);

    const handleDuplicate = () => {
        const nodes = getNodes();
        const currentNode = nodes.find(n => n.id === id);
        if (currentNode) {
            const newNode = {
                ...currentNode,
                id: `node_${Date.now()}`,
                position: { x: currentNode.position.x + 50, y: currentNode.position.y + 50 },
                selected: false
            };
            setNodes([...nodes, newNode]);
        }
    };

    const handleDelete = () => {
        const nodes = getNodes();
        setNodes(nodes.filter(n => n.id !== id));
    };

    return (
        <div className={`overflow-hidden rounded-lg bg-white shadow-lg transition-all duration-200 ${selected ? 'ring-2 ring-indigo-500' : ''} ${isValid ? 'border-2 border-gray-200' : 'border-2 border-red-300'}`} style={{ minWidth: '280px', maxWidth: '320px' }}>
            {/* Input Handle */}
            <Handle 
                type="target" 
                position={Position.Left} 
                className={`w-3 h-3 rounded-full border-2 border-white ${isValid ? 'bg-indigo-500' : 'bg-red-500'}`} 
            />

            {/* Gradient Bar */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${isValid ? 'from-indigo-500 to-violet-400' : 'from-red-500 to-orange-500'}`}></div>
            
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                        <div className={`mr-3 rounded-lg p-2 ${isValid ? 'bg-indigo-100 text-indigo-600' : 'bg-red-100 text-red-600'}`}>
                            <LogOut className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-800">{data.label || 'Redirigir a Flujo'}</span>
                            {!isValid && <span className="text-[10px] text-red-500">Campo requerido</span>}
                        </div>
                    </div>
                    
                    <div className="flex space-x-1">
                        <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button onClick={handleDuplicate} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                            <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={handleDelete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Validation Error Message */}
                {!isValid && isExpanded && (
                    <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        Selecciona el flujo al que deseas redirigir la conversación.
                    </div>
                )}

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="space-y-4">
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${isValid ? 'text-gray-700' : 'text-red-600'}`}>
                                Seleccionar Flujo Destino <span className="text-red-500">*</span>
                            </label>
                            
                            {otherFlows.length === 0 ? (
                                <div className="text-xs text-gray-400 italic bg-gray-50 p-2.5 rounded-md border border-gray-100">
                                    No hay otros flujos activos disponibles para conectar. Crea otro flujo primero.
                                </div>
                            ) : (
                                <select
                                    value={targetFlowId}
                                    onChange={(e) => setTargetFlowId(e.target.value)}
                                    className={`block w-full rounded-md text-sm shadow-sm ${!isValid ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'}`}
                                >
                                    <option value="">-- Seleccionar flujo --</option>
                                    {otherFlows.map((flow) => (
                                        <option key={flow.id} value={flow.id}>
                                            {flow.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
