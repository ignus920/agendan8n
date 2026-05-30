import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Play, ChevronDown, ChevronUp, Copy, Trash2, X, AlertCircle } from 'lucide-react';

export default function TriggerNode({ id, data, selected }) {
    const { updateNodeData, getNodes, setNodes } = useReactFlow();
    
    // Default values if data.output doesn't exist
    const initialOutput = data.output?.[0] || {
        reply_type_text: "",
        reply_type: "",
        rel_type: "",
        trigger: "",
    };

    const [relationType, setRelationType] = useState(initialOutput.rel_type || "");
    const [replyType, setReplyType] = useState(initialOutput.reply_type ? parseInt(initialOutput.reply_type) : "");
    const [keywords, setKeywords] = useState(initialOutput.trigger ? initialOutput.trigger.split(',').filter(Boolean) : []);
    const [newKeyword, setNewKeyword] = useState("");
    const [isExpanded, setIsExpanded] = useState(true);
    const [errors, setErrors] = useState({ relationType: false, replyType: false, keywords: false });

    const relationTypes = [
        { id: "lead", label: "Lead (Prospecto)" },
        { id: "customer", label: "Cliente" },
        { id: "guest", label: "Invitado" },
    ];

    const replyTypes = [
        { id: 1, label: "coincidencia exacta", description: "Se activa cuando el mensaje coincide exactamente con las palabras clave" },
        { id: 2, label: "cuando el mensaje contiene", description: "Se activa cuando el mensaje contiene alguna palabra clave" },
        { id: 3, label: "cuando envían el primer mensaje", description: "Se activa solo en la primera interacción" },
        { id: 4, label: "si ninguna palabra coincide", description: "Respuesta predeterminada si no hay coincidencia" },
    ];

    const keywordSuggestions = ["hola", "empezar", "ayuda", "info", "menu", "pedido", "soporte", "contacto"];

    // Validation
    const validate = (rel, rep, keys) => {
        const newErrors = {
            relationType: !rel,
            replyType: !rep,
            keywords: (rep === 1 || rep === 2) && keys.length === 0
        };
        setErrors(newErrors);
        return !newErrors.relationType && !newErrors.replyType && !newErrors.keywords;
    };

    // Whenever state changes, update the node data in React Flow
    useEffect(() => {
        const isValid = validate(relationType, replyType, keywords);
        
        const typeMap = {
            1: "Coincidencia exacta",
            2: "Cuando el mensaje contiene",
            3: "Cuando envían el primer mensaje",
            4: "Si ninguna palabra coincide",
        };

        updateNodeData(id, {
            ...data,
            isValid,
            output: [{
                reply_type_text: typeMap[replyType] || "Cuando el mensaje contiene",
                reply_type: replyType.toString(),
                rel_type: relationType,
                trigger: keywords.join(',')
            }]
        });
    }, [relationType, replyType, keywords]);

    const handleAddKeyword = () => {
        if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
            setKeywords([...keywords, newKeyword.trim()]);
            setNewKeyword("");
        }
    };

    const handleRemoveKeyword = (index) => {
        setKeywords(keywords.filter((_, i) => i !== index));
    };

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
        if (id !== "1") {
            const nodes = getNodes();
            setNodes(nodes.filter(n => n.id !== id));
        }
    };

    const canDelete = id !== "1";
    const isValid = !errors.relationType && !errors.replyType && !errors.keywords;
    const isKeywordDisabled = replyType === 3 || replyType === 4;

    return (
        <div className={`overflow-hidden rounded-lg bg-white shadow-lg transition-all duration-200 ${selected ? 'ring-2 ring-purple-500' : ''} ${isValid ? 'border-2 border-gray-200' : 'border-2 border-red-300'}`} style={{ minWidth: '320px', maxWidth: '380px' }}>
            {/* Gradient Bar */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${isValid ? 'from-purple-500 to-indigo-600' : 'from-red-500 to-orange-500'}`}></div>
            
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <div className={`mr-3 rounded-lg p-2 ${isValid ? 'bg-purple-100 text-purple-600' : 'bg-red-100 text-red-600'}`}>
                            <Play className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-800">{data.label || 'Disparador Inicial'}</span>
                            <span className="mt-1 inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-purple-500"></span> Punto de Entrada
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex space-x-1">
                        <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button onClick={handleDuplicate} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                            <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={handleDelete} disabled={!canDelete} className={`p-1.5 rounded ${canDelete ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-200 cursor-not-allowed'}`}>
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Validation Error */}
                {!isValid && isExpanded && (
                    <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-600 flex items-start">
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                            <div className="font-semibold mb-1">Por favor corrige lo siguiente:</div>
                            <ul className="list-disc pl-4 space-y-0.5">
                                {errors.relationType && <li>El tipo de contacto es requerido</li>}
                                {errors.replyType && <li>El tipo de disparador es requerido</li>}
                                {errors.keywords && <li>Se requiere al menos una palabra clave</li>}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="space-y-4">
                        {/* Contact Type */}
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${errors.relationType ? 'text-red-600' : 'text-gray-700'}`}>Tipo de Contacto <span className="text-red-500">*</span></label>
                            <select 
                                value={relationType} 
                                onChange={(e) => setRelationType(e.target.value)}
                                className={`w-full rounded-md text-sm shadow-sm ${errors.relationType ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'}`}
                            >
                                <option value="" disabled>Seleccionar tipo</option>
                                {relationTypes.map(rt => (
                                    <option key={rt.id} value={rt.id}>{rt.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Trigger Type */}
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${errors.replyType ? 'text-red-600' : 'text-gray-700'}`}>Tipo de Disparador <span className="text-red-500">*</span></label>
                            <select 
                                value={replyType} 
                                onChange={(e) => setReplyType(parseInt(e.target.value))}
                                className={`w-full rounded-md text-sm shadow-sm ${errors.replyType ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'}`}
                            >
                                <option value="" disabled>Seleccionar tipo</option>
                                {replyTypes.map(rt => (
                                    <option key={rt.id} value={rt.id}>{rt.label}</option>
                                ))}
                            </select>
                            {replyType && <p className="mt-1 text-[10px] text-gray-500">{replyTypes.find(r => r.id === replyType)?.description}</p>}
                        </div>

                        {/* Keywords */}
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${errors.keywords ? 'text-red-600' : 'text-gray-700'}`}>Palabras Clave <span className="text-red-500">*</span></label>
                            <p className="text-[10px] text-gray-500 mb-2 italic">Este flujo se activará cuando un usuario envíe alguna de estas palabras.</p>
                            
                            <div className="flex mb-2">
                                <input 
                                    type="text" 
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                                    disabled={isKeywordDisabled}
                                    placeholder="Añadir palabra clave..."
                                    className={`flex-grow rounded-l-md text-sm border-r-0 ${errors.keywords ? 'border-red-300' : 'border-gray-300'} ${isKeywordDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                                <button 
                                    onClick={handleAddKeyword}
                                    disabled={isKeywordDisabled || !newKeyword.trim()}
                                    className="bg-purple-600 text-white px-3 rounded-r-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    Añadir
                                </button>
                            </div>

                            {/* Suggestions */}
                            <div className="mb-2">
                                <div className="text-[10px] font-semibold text-gray-500 mb-1">Sugerencias:</div>
                                <div className="flex flex-wrap gap-1">
                                    {keywordSuggestions.filter(k => !keywords.includes(k)).map(keyword => (
                                        <button 
                                            key={keyword}
                                            onClick={() => { setKeywords([...keywords, keyword]); setNewKeyword(""); }}
                                            disabled={isKeywordDisabled}
                                            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded hover:bg-gray-200 disabled:opacity-50"
                                        >
                                            {keyword}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {keywords.length === 0 ? (
                                    <div className={`w-full text-center p-3 rounded-md bg-gray-50 border border-dashed ${errors.keywords ? 'border-red-300 text-red-500' : 'border-gray-200 text-gray-400'} text-xs`}>
                                        Sin palabras clave.
                                    </div>
                                ) : (
                                    keywords.map((kw, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded bg-purple-100 text-purple-800 text-xs font-medium">
                                            {kw}
                                            <button 
                                                onClick={() => handleRemoveKeyword(idx)}
                                                disabled={isKeywordDisabled}
                                                className="ml-1 text-purple-600 hover:text-purple-900 disabled:opacity-50"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Handle 
                type="source" 
                position={Position.Right} 
                className={`w-3 h-3 rounded-full border-2 border-white ${isValid ? 'bg-purple-500' : 'bg-red-500'}`} 
            />
        </div>
    );
}
