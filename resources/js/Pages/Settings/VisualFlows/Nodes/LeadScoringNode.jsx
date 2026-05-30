import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Target, ChevronDown, ChevronUp, Copy, Trash2, AlertCircle } from 'lucide-react';

export default function LeadScoringNode({ id, data, selected }) {
    const { updateNodeData, getNodes, setNodes } = useReactFlow();
    
    const initialOutput = data.output?.[0] || {
        action: "add",
        points: 10,
    };

    const [actionType, setActionType] = useState(initialOutput.action || "add");
    const [points, setPoints] = useState(initialOutput.points || 10);
    const [isExpanded, setIsExpanded] = useState(true);
    const [errors, setErrors] = useState({ points: false });

    const validate = (pts) => {
        const newErrors = {
            points: !pts || isNaN(pts) || pts <= 0,
        };
        setErrors(newErrors);
        return !newErrors.points;
    };

    useEffect(() => {
        const isValid = validate(points);
        
        updateNodeData(id, {
            ...data,
            isValid,
            output: [{
                action: actionType,
                points: parseInt(points, 10),
                type_text: `${actionType === 'add' ? 'Sumar' : 'Restar'} ${points} pts`
            }]
        });
    }, [actionType, points]);

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

    const isValid = !errors.points;

    return (
        <div className={`overflow-hidden rounded-lg bg-white shadow-lg transition-all duration-200 ${selected ? 'ring-2 ring-emerald-500' : ''} ${isValid ? 'border-2 border-slate-200' : 'border-2 border-red-300'}`} style={{ minWidth: '320px', maxWidth: '380px' }}>
            <Handle 
                type="target" 
                position={Position.Left} 
                className={`w-3 h-3 rounded-full border-2 border-white ${isValid ? 'bg-emerald-500' : 'bg-red-500'}`} 
            />
            
            {/* Gradient Bar */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${isValid ? 'from-emerald-400 to-teal-500' : 'from-red-500 to-orange-500'}`}></div>
            
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <div className={`mr-3 rounded-lg p-2 ${isValid ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            <Target className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">{data.label || 'Actualizar Lead Score'}</span>
                            <span className="mt-1 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Acción
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
                            <div className="font-semibold mb-1">Por favor corrige lo siguiente:</div>
                            <ul className="list-disc pl-4 space-y-0.5">
                                {errors.points && <li>Los puntos deben ser un número mayor a 0</li>}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="w-1/2">
                                <label className="block text-xs font-medium mb-1 text-slate-700">Acción <span className="text-red-500">*</span></label>
                                <select 
                                    value={actionType} 
                                    onChange={(e) => setActionType(e.target.value)}
                                    className="w-full rounded-md text-sm shadow-sm border-slate-300 focus:border-emerald-500 focus:ring-emerald-200"
                                >
                                    <option value="add">Sumar</option>
                                    <option value="subtract">Restar</option>
                                </select>
                            </div>
                            <div className="w-1/2">
                                <label className={`block text-xs font-medium mb-1 ${errors.points ? 'text-red-600' : 'text-slate-700'}`}>Puntos <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={points}
                                        onChange={(e) => setPoints(e.target.value)}
                                        className={`w-full rounded-md text-sm shadow-sm pr-8 ${errors.points ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'}`}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <span className="text-slate-500 sm:text-xs">pts</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 text-center">
                            <div className={`inline-block px-3 py-1 rounded-md text-sm font-bold ${actionType === 'add' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {actionType === 'add' ? '+' : '-'}{points || 0} pts
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Handle 
                type="source" 
                position={Position.Right} 
                className={`w-3 h-3 rounded-full border-2 border-white ${isValid ? 'bg-emerald-500' : 'bg-red-500'}`} 
            />
        </div>
    );
}
