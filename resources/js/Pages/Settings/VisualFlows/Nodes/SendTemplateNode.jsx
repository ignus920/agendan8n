import React, { useState, useEffect, useContext } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Send, ChevronDown, ChevronUp, Copy, Trash2, AlertCircle } from 'lucide-react';
import { FlowEditorContext } from '../FlowEditorContext';

export default function SendTemplateNode({ id, data, selected }) {
    const { updateNodeData, getNodes, setNodes } = useReactFlow();
    const { whatsmarkTemplates = [] } = useContext(FlowEditorContext);
    
    // Default values if data.output doesn't exist
    const initialOutput = data.output?.[0] || { template_name: "", template_params: [] };
    
    const [templateName, setTemplateName] = useState(initialOutput.template_name || "");
    const [templateParams, setTemplateParams] = useState(initialOutput.template_params || []);
    const [isExpanded, setIsExpanded] = useState(data.isExpanded !== false);

    const selectedTemplate = whatsmarkTemplates.find(t => t.template_name === templateName);
    
    // Extract variables like {{1}}, {{2}} from body_data
    const bodyData = selectedTemplate?.body_data || '';
    const matches = bodyData.match(/\{\{\d+\}\}/g) || [];
    const variables = [...new Set(matches)].sort(); // unique e.g., ["{{1}}", "{{2}}"]

    const isValid = templateName !== "" && variables.every((v, i) => templateParams[i] !== undefined && templateParams[i].trim() !== "");

    useEffect(() => {
        // Synchronize params array size with number of variables if mismatch
        if (variables.length !== templateParams.length) {
            const newParams = [...templateParams];
            // Truncate or expand
            if (newParams.length > variables.length) {
                newParams.length = variables.length;
            } else {
                while (newParams.length < variables.length) {
                    newParams.push("");
                }
            }
            setTemplateParams(newParams);
        }
    }, [templateName, variables.length]);

    useEffect(() => {
        updateNodeData(id, {
            ...data,
            isValid,
            isExpanded,
            errorMessage: templateName === "" 
                ? "Debe seleccionar una plantilla" 
                : !isValid 
                ? "Todos los parámetros son obligatorios" 
                : "",
            output: [{ template_name: templateName, template_params: templateParams }]
        });
    }, [templateName, templateParams, isValid, isExpanded]);

    const handleParamChange = (index, value) => {
        const newParams = [...templateParams];
        newParams[index] = value;
        setTemplateParams(newParams);
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
        const nodes = getNodes();
        setNodes(nodes.filter(n => n.id !== id));
    };

    return (
        <div className={`overflow-hidden rounded-lg bg-white shadow-lg transition-all duration-200 ${selected ? 'ring-2 ring-teal-500' : ''} ${isValid ? 'border-2 border-gray-200' : 'border-2 border-red-300'}`} style={{ minWidth: '280px', maxWidth: '320px' }}>
            {/* Input Handle */}
            <Handle 
                type="target" 
                position={Position.Left} 
                className={`w-3 h-3 rounded-full border-2 border-white ${isValid ? 'bg-teal-500' : 'bg-red-500'}`} 
            />

            {/* Gradient Bar */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${isValid ? 'from-teal-500 to-emerald-400' : 'from-red-500 to-orange-500'}`}></div>
            
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                        <div className={`mr-3 rounded-lg p-2 ${isValid ? 'bg-teal-100 text-teal-600' : 'bg-red-100 text-red-600'}`}>
                            <Send className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-800">{data.label || 'Enviar Plantilla'}</span>
                            {!isValid && <span className="text-[10px] text-red-500">Incompleto</span>}
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
                        {templateName === "" ? "Selecciona una plantilla oficial." : "Todos los parámetros son requeridos."}
                    </div>
                )}

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium mb-1 text-gray-700">
                                Plantilla Homologada <span className="text-red-500">*</span>
                            </label>
                            
                            {whatsmarkTemplates.length === 0 ? (
                                <div className="text-xs text-gray-400 italic bg-gray-50 p-2.5 rounded-md border border-gray-100">
                                    No hay plantillas oficiales disponibles en esta instancia.
                                </div>
                            ) : (
                                <select
                                    value={templateName}
                                    onChange={(e) => {
                                        setTemplateName(e.target.value);
                                        setTemplateParams([]);
                                    }}
                                    className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-teal-500 focus:ring-teal-200"
                                >
                                    <option value="">-- Seleccionar plantilla --</option>
                                    {whatsmarkTemplates.map((t) => (
                                        <option key={t.id || t.template_name} value={t.template_name}>
                                            {t.template_name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Template parameters inputs */}
                        {selectedTemplate && variables.length > 0 && (
                            <div className="space-y-3 pt-2 border-t border-gray-100">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Parámetros de Plantilla</span>
                                <div className="text-[10px] text-gray-500 font-mono italic bg-gray-50 p-2 rounded border border-gray-100 truncate" title={bodyData}>
                                    Vista previa: "{bodyData}"
                                </div>
                                <div className="space-y-2">
                                    {variables.map((variable, i) => {
                                        const paramVal = templateParams[i] || "";
                                        return (
                                            <div key={variable}>
                                                <label className="block text-[10px] font-bold text-gray-600 mb-1">
                                                    Variable {variable}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={paramVal}
                                                    onChange={(e) => handleParamChange(i, e.target.value)}
                                                    placeholder={`Valor para variable ${variable}`}
                                                    className={`block w-full rounded-md text-xs shadow-sm ${paramVal.trim() === "" ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-200'}`}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-2 text-[9px] text-gray-450">
                                    Variables de contacto disponibles: <code className="font-mono bg-gray-100 px-1 rounded">{`{contact.name}`}</code>, <code className="font-mono bg-gray-100 px-1 rounded">{`{contact.phone}`}</code>, <code className="font-mono bg-gray-100 px-1 rounded">{`{products_list}`}</code>, <code className="font-mono bg-gray-100 px-1 rounded">{`{schedules_list}`}</code>.
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Output Handle */}
            <Handle 
                type="source" 
                position={Position.Right} 
                className={`w-3 h-3 rounded-full border-2 border-white ${isValid ? 'bg-teal-500' : 'bg-red-500'}`} 
            />
        </div>
    );
}
