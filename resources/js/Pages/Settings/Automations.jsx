import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { 
    Cpu, 
    Zap, 
    Activity, 
    Settings, 
    Sliders, 
    ArrowRight, 
    MessageSquare, 
    Link2, 
    Play, 
    AlertCircle, 
    Plus, 
    Check, 
    X,
    Eye,
    Code,
    Sparkles,
    Flame
} from 'lucide-react';

export default function AutomationsIndex({ automations, scoringRules }) {
    const [activeTab, setActiveTab] = useState('flows'); // flows, scoring
    const [selectedAutomation, setSelectedAutomation] = useState(null);
    const [isEditingJson, setIsEditingJson] = useState(false);
    const [jsonInput, setJsonInput] = useState('');
    const [jsonError, setJsonError] = useState(null);

    const eventNames = {
        contact_created: 'Contacto Creado',
        contact_updated: 'Contacto Actualizado',
        contact_score_changed: 'Score del Contacto Cambiado',
        booking_created: 'Cita Agendada',
        booking_confirmed: 'Cita Confirmada',
        booking_cancelled: 'Cita Cancelada',
        booking_completed: 'Cita Completada',
        purchase_created: 'Compra Registrada',
        repurchase_due: 'Alerta de Recompra Vencida',
        lead_inactive: 'Lead Inactivo',
        message_received: 'Mensaje Recibido (WhatsApp)',
        campaign_sent: 'Campaña Enviada'
    };

    const actionNames = {
        send_whatsapp: 'Enviar WhatsApp',
        update_score: 'Actualizar Score',
        update_funnel: 'Actualizar Embudo',
        create_task: 'Crear Tarea',
        assign_advisor: 'Asignar Asesor',
        trigger_ai: 'Ejecutar Clasificación IA',
        schedule_followup: 'Programar Seguimiento',
        trigger_n8n: 'Lanzar Webhook n8n',
        update_memory: 'Actualizar Memoria',
        pause_bot: 'Pausar Bot IA'
    };

    const actionColors = {
        send_whatsapp: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        trigger_n8n: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
        trigger_ai: 'bg-blue-50 text-blue-700 border-blue-200/80',
        update_funnel: 'bg-brand-teal-light text-brand-teal border-brand-teal/20',
        update_score: 'bg-amber-50 text-amber-700 border-amber-200/80',
        pause_bot: 'bg-red-50 text-red-700 border-red-200/80'
    };

    const handleOpenEdit = (automation) => {
        setSelectedAutomation(automation);
        setJsonInput(JSON.stringify(automation.actions, null, 4));
        setIsEditingJson(true);
        setJsonError(null);
    };

    const handleSaveJson = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            if (!Array.isArray(parsed)) {
                throw new Error("Las acciones deben ser una lista (array) de objetos de acción.");
            }
            
            // Simulación de guardado exitoso
            setSelectedAutomation({
                ...selectedAutomation,
                actions: parsed
            });
            setIsEditingJson(false);
            setJsonError(null);
            alert("Acciones JSON validadas y actualizadas localmente para demostración.");
        } catch (e) {
            setJsonError(e.message);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            Motor de Automatización (Automation Engine)
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Controla las reglas basadas en eventos, scoring de contactos y flujos de n8n.</p>
                    </div>
                </div>
            }
        >
            <Head title="Automatizaciones" />

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 mb-6 gap-6">
                <button
                    onClick={() => { setActiveTab('flows'); setSelectedAutomation(null); setIsEditingJson(false); }}
                    className={`pb-4 text-sm font-bold relative transition-colors ${
                        activeTab === 'flows' ? 'text-brand-teal font-extrabold' : 'text-slate-400 hover:text-slate-700'
                    }`}
                >
                    Flujos de Automatización
                    {activeTab === 'flows' && (
                        <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-teal shadow-[0_0_8px_rgba(70,164,189,0.5)]"></span>
                    )}
                </button>
                <button
                    onClick={() => { setActiveTab('scoring'); setSelectedAutomation(null); setIsEditingJson(false); }}
                    className={`pb-4 text-sm font-bold relative transition-colors ${
                        activeTab === 'scoring' ? 'text-brand-teal font-extrabold' : 'text-slate-400 hover:text-slate-700'
                    }`}
                >
                    Reglas de Lead Scoring
                    {activeTab === 'scoring' && (
                        <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-teal shadow-[0_0_8px_rgba(70,164,189,0.5)]"></span>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                {/* Left Listing Panel */}
                <div className="xl:col-span-2 space-y-5">
                    {activeTab === 'flows' ? (
                        /* Flows Listing */
                        <div className="space-y-4">
                            {automations.map((flow) => {
                                const isSelected = selectedAutomation?.id === flow.id;
                                return (
                                    <div 
                                        key={flow.id} 
                                        onClick={() => setSelectedAutomation(flow)}
                                        className={`bg-white border rounded-2xl p-5 cursor-pointer transition-all duration-300 shadow-sm ${
                                            isSelected 
                                                ? 'border-brand-teal/40 bg-brand-teal-light/15 shadow-sm' 
                                                : 'border-slate-200/80 hover:border-slate-350 hover:bg-slate-50/50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2.5">
                                                    <h3 className="font-bold text-sm text-slate-800">{flow.name}</h3>
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                                                        flow.is_active 
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                            : 'bg-slate-100 text-slate-450 border-slate-200'
                                                    }`}>
                                                        {flow.is_active ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                                                    <span className="font-semibold">Disparador:</span>
                                                    <span className="text-brand-teal font-extrabold font-mono">{eventNames[flow.event_type] || flow.event_type}</span>
                                                </div>
                                            </div>

                                            <div className="text-right text-[10px] text-slate-400 font-mono font-semibold">
                                                <div>Prioridad: {flow.priority}</div>
                                                <div className="mt-0.5">Cooldown: {flow.cooldown_hours}h</div>
                                            </div>
                                        </div>

                                        {/* Visual Conditions & Actions flow preview */}
                                        <div className="h-px bg-slate-100 my-4"></div>

                                        <div className="flex flex-col gap-2.5">
                                            {/* Conditions */}
                                            {flow.conditions && Object.keys(flow.conditions).length > 0 ? (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">SI:</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {Object.entries(flow.conditions).map(([key, val]) => (
                                                            <span key={key} className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[10px] text-slate-650 font-mono font-semibold">
                                                                {key} == "{val}"
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-400 italic">Sin condiciones restrictivas (Ejecuta siempre)</div>
                                            )}

                                            {/* Actions Sequence Preview */}
                                            <div className="flex items-center gap-2 text-xs mt-1">
                                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">ENTONCES:</span>
                                                <div className="flex items-center gap-1.5 flex-wrap font-semibold">
                                                    {flow.actions.map((act, index) => (
                                                        <div key={index} className="flex items-center gap-1.5">
                                                            {index > 0 && <ArrowRight className="h-3 w-3 text-slate-350" />}
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${actionColors[act.type] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                                {actionNames[act.type] || act.type}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Lead Scoring Rules Listing */
                        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                                        <th className="px-6 py-4">Regla / Acción</th>
                                        <th className="px-6 py-4">Evento Detonante</th>
                                        <th className="px-6 py-4 text-center">Score Delta</th>
                                        <th className="px-6 py-4 text-right">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-755">
                                    {scoringRules.map((rule) => {
                                        const isPositive = rule.score_delta > 0;
                                        return (
                                            <tr key={rule.id} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800">{rule.name}</div>
                                                    {rule.condition && Object.keys(rule.condition).length > 0 && (
                                                        <div className="text-[10px] text-slate-450 font-mono mt-0.5 font-normal">
                                                            Condición: {JSON.stringify(rule.condition)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 font-mono">
                                                    {eventNames[rule.event_type] || rule.event_type}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${
                                                        isPositive 
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                            : 'bg-red-50 text-red-700 border-red-200'
                                                    }`}>
                                                        {isPositive ? `+${rule.score_delta}` : rule.score_delta} pts
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                                                        rule.is_active ? 'bg-emerald-550 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-slate-300'
                                                    }`}></span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Right side JSON Detail editor / Documentation */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 min-h-[500px] shadow-sm">
                    {selectedAutomation ? (
                        <div className="space-y-6">
                            <div>
                                <div className="text-xs text-brand-teal font-extrabold font-mono uppercase tracking-wider">Detalles de la Automatización</div>
                                <h3 className="font-bold text-base text-slate-800 mt-1">{selectedAutomation.name}</h3>
                                <p className="text-xs text-slate-600 mt-1.5 font-mono bg-slate-50 p-2 rounded border border-slate-200">
                                    Trigger: {selectedAutomation.event_type}
                                </p>
                            </div>

                            <div className="h-px bg-slate-100"></div>

                            {/* JSON Editor Box */}
                            {isEditingJson ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Code className="h-3.5 w-3.5 text-brand-teal" />
                                            Plantilla JSON de Acciones
                                        </label>
                                        <button 
                                            onClick={() => setIsEditingJson(false)} 
                                            className="text-[10px] text-slate-450 hover:text-slate-700 font-bold underline"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                    
                                    <textarea
                                        value={jsonInput}
                                        onChange={(e) => setJsonInput(e.target.value)}
                                        rows="12"
                                        className="font-mono text-xs w-full bg-slate-900 border border-slate-200 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal"
                                    />

                                    {jsonError && (
                                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
                                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                            <span className="font-mono font-semibold">{jsonError}</span>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleSaveJson}
                                            className="flex-1 text-xs bg-brand-teal hover:bg-brand-teal/90 text-white font-bold py-2 rounded-xl transition-all shadow-sm"
                                        >
                                            Guardar Cambios
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secuencia de Acciones</span>
                                        <button 
                                            onClick={() => handleOpenEdit(selectedAutomation)}
                                            className="text-[10px] text-brand-teal hover:underline flex items-center gap-1 font-bold"
                                        >
                                            <Code className="h-3 w-3" />
                                            Editar JSON
                                        </button>
                                    </div>

                                    {/* Vertical Steps */}
                                    <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                                        {selectedAutomation.actions.map((act, index) => (
                                            <div key={index} className="flex items-start gap-4 relative z-10">
                                                <div className="h-8.5 w-8.5 rounded-full bg-slate-50 border border-slate-200 text-slate-550 font-bold flex items-center justify-center text-xs shrink-0 shadow-inner">
                                                    {index + 1}
                                                </div>
                                                <div className="bg-slate-50/40 border border-slate-150 p-3 rounded-xl flex-1 shadow-sm">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${actionColors[act.type] || 'bg-white text-slate-600 border-slate-200'}`}>
                                                            {actionNames[act.type] || act.type}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Parameters view */}
                                                    {act.params && Object.keys(act.params).map((key) => (
                                                        <div key={key} className="mt-2 text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-150 font-mono break-all font-semibold">
                                                            <span className="text-slate-400 font-bold">{key}:</span> {
                                                                typeof act.params[key] === 'object'
                                                                    ? JSON.stringify(act.params[key])
                                                                    : act.params[key]
                                                            }
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Informational placeholder when no automation is selected */
                        <div className="my-auto text-center py-12 text-slate-400 flex flex-col justify-center h-full bg-slate-50/30 border border-dashed border-slate-200 rounded-xl p-4">
                            <Cpu className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                            <h3 className="font-bold text-slate-700 text-xs">Motor de Flujos Autónomos</h3>
                            <p className="text-[11px] text-slate-450 mt-2 max-w-xs mx-auto leading-relaxed font-semibold">
                                El sistema ejecuta reglas JSON ordenadas por prioridad cuando ocurren eventos en WhatsApp o en la agenda. Selecciona un flujo para ver o editar sus acciones.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
