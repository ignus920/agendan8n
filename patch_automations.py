import json
import sys

with open("resources/js/Pages/Settings/Automations.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Import axios
content = content.replace(
    "import { Head, router } from '@inertiajs/react';",
    "import { Head, router } from '@inertiajs/react';\nimport axios from 'axios';"
)

# 2. Add components
components_code = """
const GlobalMermaidDiagram = ({ automations }) => {
    const [svg, setSvg] = useState('');

    useEffect(() => {
        const renderDiagram = async () => {
            if (!automations || automations.length === 0) return;

            let graphDefinition = 'graph TD;\\n';
            
            // Group by event type
            const byEvent = {};
            automations.forEach(a => {
                if (!byEvent[a.event_type]) byEvent[a.event_type] = [];
                byEvent[a.event_type].push(a);
            });

            Object.keys(byEvent).forEach((eventType, i) => {
                graphDefinition += `    subgraph Evento${i}["${eventNames[eventType] || eventType}"]\\n`;
                byEvent[eventType].forEach(a => {
                    const nodeName = `Auto_${a.id}`;
                    graphDefinition += `        ${nodeName}["${a.name}"]\\n`;
                });
                graphDefinition += `    end\\n`;
            });

            // Add links for trigger_automation
            automations.forEach(a => {
                if (a.actions) {
                    a.actions.forEach(act => {
                        if (act.type === 'trigger_automation' && act.params?.automation_id) {
                            graphDefinition += `    Auto_${a.id} -->|Salta a| Auto_${act.params.automation_id}\\n`;
                        }
                    });
                }
            });

            try {
                const mermaidModule = await import('mermaid');
                const mermaid = mermaidModule.default;
                const id = `global-mermaid-${Date.now()}`;
                const { svg } = await mermaid.render(id, graphDefinition);
                setSvg(svg);
            } catch (error) {
                console.error("Global Mermaid error:", error);
            }
        };
        renderDiagram();
    }, [automations]);

    if (!svg) return <div className="p-8 text-center text-slate-400 font-bold">Generando diagrama interactivo...</div>;

    return (
        <div 
            className="w-full flex justify-center py-4 overflow-x-auto bg-slate-50/50 rounded-xl border border-slate-100 min-h-[400px]"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};

const SimulationPanel = ({ automations }) => {
    const [eventType, setEventType] = useState('message_received');
    const [funnelStage, setFunnelStage] = useState('new');
    const [leadScore, setLeadScore] = useState(0);
    const [message, setMessage] = useState('Hola');
    const [logs, setLogs] = useState(null);
    const [loading, setLoading] = useState(false);

    const runSimulation = async () => {
        setLoading(true);
        try {
            const res = await axios.post('/settings/automations/simulate', {
                event_type: eventType,
                contact: {
                    funnel_stage: funnelStage,
                    lead_score: parseInt(leadScore),
                    is_active: true
                },
                payload: {
                    message: message
                }
            });
            setLogs(res.data.logs);
        } catch (e) {
            console.error(e);
            alert("Error ejecutando simulación.");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-brand-teal" />
                    Configurar Test
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Evento Disparador</label>
                        <select value={eventType} onChange={e=>setEventType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-brand-teal focus:border-brand-teal p-2.5">
                            {Object.entries(eventNames).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Mensaje Recibido (payload)</label>
                        <input type="text" value={message} onChange={e=>setMessage(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-brand-teal focus:border-brand-teal p-2.5" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Etapa de Embudo del Contacto</label>
                        <select value={funnelStage} onChange={e=>setFunnelStage(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-brand-teal focus:border-brand-teal p-2.5">
                            <option value="new">Nuevo (new)</option>
                            <option value="interested">Interesado (interested)</option>
                            <option value="qualified">Calificado (qualified)</option>
                            <option value="client">Cliente (client)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Lead Score Inicial</label>
                        <input type="number" value={leadScore} onChange={e=>setLeadScore(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-brand-teal focus:border-brand-teal p-2.5" />
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={runSimulation} disabled={loading} className="bg-brand-teal hover:bg-brand-teal/90 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50">
                        <Play className="h-4 w-4" />
                        {loading ? 'Simulando...' : 'Probar Flujo'}
                    </button>
                </div>
            </div>
            
            {logs && (
                <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800">
                    <h3 className="text-emerald-400 font-bold mb-4 flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        Trace de Simulación ({logs.length} reglas ejecutadas)
                    </h3>
                    <div className="space-y-4">
                        {logs.length === 0 && <p className="text-slate-500 text-sm italic">Ninguna regla reaccionó a este evento y condiciones.</p>}
                        {logs.map((log, idx) => (
                            <div key={idx} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-emerald-300 font-bold text-sm">{log.automation.name}</span>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${log.status === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400'}`}>
                                        {log.status}
                                    </span>
                                </div>
                                {log.status === 'success' && (
                                    <div className="space-y-2 mt-3 pl-3 border-l-2 border-slate-600">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Acciones Ejecutadas</p>
                                        {log.actions_executed.map((act, i) => (
                                            <div key={i} className="text-xs text-slate-300 bg-slate-900 p-2 rounded">
                                                <span className="text-brand-teal font-semibold">{actionNames[act.type] || act.type}</span>
                                                <pre className="mt-1 text-[10px] text-slate-500 font-mono overflow-x-auto">
                                                    {JSON.stringify(act.params, null, 2)}
                                                </pre>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {log.status !== 'success' && log.error_message && (
                                    <p className="text-xs text-amber-400 mt-2 bg-amber-400/10 p-2 rounded">{log.error_message}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

"""
content = content.replace("const MermaidDiagram = ({ flow }) => {", components_code + "\nconst MermaidDiagram = ({ flow }) => {")

# 3. Add tabs
tabs_code = """
                <button
                    onClick={() => { setActiveTab('global'); setSelectedAutomation(null); setIsEditingJson(false); }}
                    className={`pb-4 text-sm font-bold relative transition-colors ${
                        activeTab === 'global' ? 'text-brand-teal font-extrabold' : 'text-slate-400 hover:text-slate-700'
                    }`}
                >
                    Vista Global
                    {activeTab === 'global' && (
                        <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-teal shadow-[0_0_8px_rgba(70,164,189,0.5)]"></span>
                    )}
                </button>
                <button
                    onClick={() => { setActiveTab('simulator'); setSelectedAutomation(null); setIsEditingJson(false); }}
                    className={`pb-4 text-sm font-bold relative transition-colors ${
                        activeTab === 'simulator' ? 'text-brand-teal font-extrabold' : 'text-slate-400 hover:text-slate-700'
                    }`}
                >
                    Simulador
                    {activeTab === 'simulator' && (
                        <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-teal shadow-[0_0_8px_rgba(70,164,189,0.5)]"></span>
                    )}
                </button>
"""
content = content.replace(
    "                <button\n                    onClick={() => { setActiveTab('scoring')",
    tabs_code + "                <button\n                    onClick={() => { setActiveTab('scoring')"
)

# 4. Inject views in main block
main_view_anchor = "            {activeTab === 'flows' ? ("
main_view_replacement = """            {activeTab === 'global' ? (
                <GlobalMermaidDiagram automations={automations} />
            ) : activeTab === 'simulator' ? (
                <SimulationPanel automations={automations} />
            ) : activeTab === 'flows' ? ("""
content = content.replace(main_view_anchor, main_view_replacement)

with open("resources/js/Pages/Settings/Automations.jsx", "w", encoding="utf-8") as f:
    f.write(content)
