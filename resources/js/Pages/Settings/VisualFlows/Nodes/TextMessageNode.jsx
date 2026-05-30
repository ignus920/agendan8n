import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { MessageSquare, ChevronDown, ChevronUp, Copy, Trash2, AlertCircle } from 'lucide-react';

export default function TextMessageNode({ id, data, selected }) {
    const { updateNodeData, getNodes, setNodes } = useReactFlow();
    
    // Default values if data.output doesn't exist
    const initialOutput = data.output?.[0] || { reply_text: "" };
    
    const [message, setMessage] = useState(initialOutput.reply_text || "");
    const [isExpanded, setIsExpanded] = useState(true);
    const [showCharacterWarning, setShowCharacterWarning] = useState(false);

    const characterCount = message.length;
    const isMessageValid = message.trim().length > 0;
    const isWithinCharLimit = characterCount <= 1000;
    const isValid = isMessageValid && isWithinCharLimit;

    useEffect(() => {
        updateNodeData(id, {
            ...data,
            isValid,
            errorMessage: !isMessageValid 
                ? "El texto del mensaje es obligatorio" 
                : !isWithinCharLimit 
                ? "El mensaje excede el límite de 1000 caracteres" 
                : "",
            output: [{ reply_text: message }]
        });

        if (characterCount > 1000) {
            setShowCharacterWarning(true);
            const timer = setTimeout(() => setShowCharacterWarning(false), 3000);
            return () => clearTimeout(timer);
        } else {
            setShowCharacterWarning(false);
        }
    }, [message]);

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

    let countStatusClass = "text-gray-400";
    if (characterCount > 1000) countStatusClass = "text-red-500";
    else if (characterCount > 800) countStatusClass = "text-yellow-500";

    return (
        <div className={`overflow-hidden rounded-lg bg-white shadow-lg transition-all duration-200 ${selected ? 'ring-2 ring-blue-500' : ''} ${isValid ? 'border-2 border-gray-200' : 'border-2 border-red-300'}`} style={{ minWidth: '280px', maxWidth: '320px' }}>
            {/* Input Handle */}
            <Handle 
                type="target" 
                position={Position.Left} 
                className={`w-3 h-3 rounded-full border-2 border-white ${isValid ? 'bg-blue-500' : 'bg-red-500'}`} 
            />

            {/* Gradient Bar */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${isValid ? 'from-blue-500 to-sky-400' : 'from-red-500 to-orange-500'}`}></div>
            
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                        <div className={`mr-3 rounded-lg p-2 ${isValid ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                            <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-800">{data.label || 'Mensaje de Texto'}</span>
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
                        {data.errorMessage || "El texto del mensaje es obligatorio"}
                    </div>
                )}

                {/* Character Warning */}
                {showCharacterWarning && (
                    <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        El mensaje excede el límite de 1000 caracteres
                    </div>
                )}

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="space-y-4">
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${isValid ? 'text-gray-700' : 'text-red-600'}`}>
                                Texto del Mensaje <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Escribe tu mensaje aquí..."
                                rows="5"
                                className={`block w-full resize-none rounded-md text-sm shadow-sm ${!isValid || characterCount > 1000 ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'}`}
                            />
                            
                            <div className="mt-2 flex justify-between items-center text-[10px]">
                                <div className="text-gray-500">
                                    <strong>Variables disponibles:</strong><br/>
                                    <span className="font-mono bg-gray-100 px-1 rounded mr-1" title="Lista de productos reales">{`{products_list}`}</span>
                                    <span className="font-mono bg-gray-100 px-1 rounded mr-1" title="Horarios disponibles">{`{schedules_list}`}</span><br className="mt-1"/>
                                    <span className="font-mono bg-gray-100 px-1 rounded mr-1" title="Nombre del cliente">{`{contact.name}`}</span>
                                    <span className="font-mono bg-gray-100 px-1 rounded mr-1" title="Teléfono">{`{contact.phone}`}</span>
                                    <span className="font-mono bg-gray-100 px-1 rounded" title="Servicio seleccionado">{`{last_product.name}`}</span>
                                </div>
                                <span className={`font-mono ${countStatusClass}`}>
                                    {characterCount}/1000
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Output Handle */}
            <Handle 
                type="source" 
                position={Position.Right} 
                className={`w-3 h-3 rounded-full border-2 border-white ${isValid ? 'bg-blue-500' : 'bg-red-500'}`} 
            />
        </div>
    );
}
