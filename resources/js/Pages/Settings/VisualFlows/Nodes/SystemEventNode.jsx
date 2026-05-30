import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Zap, ChevronDown, ChevronUp, Copy, Trash2, AlertCircle } from 'lucide-react';

export default function SystemEventNode({ id, data, selected }) {
    const { updateNodeData, getNodes, setNodes } = useReactFlow();
    
    const initialOutput = data.output?.[0] || {
        event_type: "",
    };

    const [eventType, setEventType] = useState(initialOutput.event_type || "");
    const [isExpanded, setIsExpanded] = useState(true);
    const [errors, setErrors] = useState({ eventType: false });

    const eventTypes = [
        { id: "appointment_scheduled", label: "Cita Agendada" },
        { id: "appointment_completed", label: "Cita Completada / Exitosa" },
        { id: "appointment_cancelled", label: "Cita Cancelada" },
        { id: "lead_inactive", label: "Lead Inactivo / Enfriándose" },
    ];

    const validate = (evType) => {
        const newErrors = {
            eventType: !evType,
        };
        setErrors(newErrors);
        return !newErrors.eventType;
    };

    useEffect(() => {
        const isValid = validate(eventType);
        
        updateNodeData(id, {
            ...data,
            isValid,
            output: [{
                event_type: eventType,
                type_text: eventTypes.find(e => e.id === eventType)?.label || "Evento de Sistema"
            }]
        });
    }, [eventType]);

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

    const isValid = !errors.eventType;

    return (
        <div className={`overflow-hidden rounded-lg bg-white shadow-lg transition-all duration-200 ${selected ? 'ring-2 ring-amber-500' : ''} ${isValid ? 'border-2 border-slate-200' : 'border-2 border-red-300'}`} style={{ minWidth: '320px', maxWidth: '380px' }}>
            {/* Gradient Bar */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${isValid ? 'from-amber-400 to-orange-500' : 'from-red-500 to-orange-500'}`}></div>
            
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <div className={`mr-3 rounded-lg p-2 ${isValid ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                            <Zap className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">{data.label || 'Evento de Sistema'}</span>
                            <span className="mt-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-amber-500"></span> Disparador Automático
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex space-x-1">
                        <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button onClick={handleDuplicate} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
                            <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={handleDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Validation Error */}
                {!isValid && isExpanded && (
                    <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-600 flex items-start">
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                            <div className="font-semibold mb-1">Por favor selecciona un evento:</div>
                            <ul className="list-disc pl-4 space-y-0.5">
                                {errors.eventType && <li>El tipo de evento es obligatorio</li>}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="space-y-4">
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${errors.eventType ? 'text-red-600' : 'text-slate-700'}`}>¿Qué evento dispara este flujo? <span className="text-red-500">*</span></label>
                            <select 
                                value={eventType} 
                                onChange={(e) => setEventType(e.target.value)}
                                className={`w-full rounded-md text-sm shadow-sm ${errors.eventType ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-amber-500 focus:ring-amber-200'}`}
                            >
                                <option value="" disabled>Seleccionar evento</option>
                                {eventTypes.map(rt => (
                                    <option key={rt.id} value={rt.id}>{rt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            <Handle 
                type="source" 
                position={Position.Right} 
                className={`w-3 h-3 rounded-full border-2 border-white ${isValid ? 'bg-amber-500' : 'bg-red-500'}`} 
            />
        </div>
    );
}
