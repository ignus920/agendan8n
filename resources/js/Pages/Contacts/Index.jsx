import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { 
    Search, 
    MessageSquare, 
    Flame, 
    Bot, 
    Pause, 
    Play, 
    Tag, 
    Calendar,
    Phone,
    Mail,
    MapPin,
    AlertCircle,
    UserCheck,
    Briefcase,
    TrendingUp
} from 'lucide-react';

export default function ContactsIndex({ contacts }) {
    const [search, setSearch] = useState('');
    const [selectedTab, setSelectedTab] = useState('all'); // all, hot, customers, lost
    const [selectedContact, setSelectedContact] = useState(null);

    // Human-readable names for funnel stages
    const stageNames = {
        new: 'Nuevo',
        interested: 'Interesado',
        qualified: 'Calificado',
        negotiation: 'Negociación',
        customer: 'Cliente',
        lost: 'Perdido'
    };

    const stageColors = {
        new: 'bg-brand-teal-light text-brand-teal border-brand-teal/20',
        interested: 'bg-blue-50 text-blue-600 border-blue-150',
        qualified: 'bg-amber-50 text-amber-700 border-amber-200',
        negotiation: 'bg-brand-orange-light text-brand-orange border-brand-orange/20',
        customer: 'bg-emerald-50 text-emerald-750 border-emerald-200',
        lost: 'bg-slate-100 text-slate-500 border-slate-200/80'
    };

    const interestColors = {
        low: 'bg-slate-100 text-slate-500 border-slate-200',
        medium: 'bg-yellow-50 text-yellow-700 border-yellow-250',
        high: 'bg-brand-orange-light text-brand-orange border-brand-orange/20',
        hot: 'bg-red-50 text-red-650 border-red-200 shadow-[0_0_8px_rgba(239,68,68,0.06)] font-bold'
    };

    const interestNames = {
        unknown: 'Desconocido',
        low: 'Bajo',
        medium: 'Medio',
        high: 'Alto',
        hot: 'Caliente'
    };

    // Filter logic
    const filteredContacts = contacts.filter(contact => {
        // Tab filter
        if (selectedTab === 'hot' && contact.interest_level !== 'hot' && contact.lead_score < 80) return false;
        if (selectedTab === 'customers' && contact.funnel_stage !== 'customer') return false;
        if (selectedTab === 'lost' && contact.funnel_stage !== 'lost') return false;

        // Search text filter
        if (search) {
            const query = search.toLowerCase();
            const nameMatch = contact.name?.toLowerCase().includes(query);
            const phoneMatch = contact.whatsapp_phone?.includes(query);
            const emailMatch = contact.email?.toLowerCase().includes(query);
            const tagMatch = contact.tags?.some(tag => tag.toLowerCase().includes(query));
            return nameMatch || phoneMatch || emailMatch || tagMatch;
        }

        return true;
    });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            Directorio de Contactos
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Administra los prospectos, su scoring y el estado del bot.</p>
                    </div>
                </div>
            }
        >
            <Head title="Contactos" />

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
                {/* Main list section */}
                <div className="xl:col-span-3 space-y-5">
                    {/* Search & Tabs bar */}
                    <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                        {/* Search Input */}
                        <div className="relative w-full md:w-80">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4.5 w-4.5 text-slate-400" />
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por nombre, cel, tags..."
                                className="block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-colors"
                            />
                        </div>

                        {/* Custom Tabs */}
                        <div className="flex gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 w-full md:w-auto overflow-x-auto">
                            {[
                                { id: 'all', label: 'Todos' },
                                { id: 'hot', label: '🔥 Calientes' },
                                { id: 'customers', label: '💼 Clientes' },
                                { id: 'lost', label: '⚠️ Perdidos' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSelectedTab(tab.id)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                        selectedTab === tab.id
                                            ? 'bg-white text-brand-teal border border-slate-200 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Contacts Table Card */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                                        <th className="px-6 py-4">Contacto</th>
                                        <th className="px-6 py-4">Fase</th>
                                        <th className="px-6 py-4">Nivel Interés / Score</th>
                                        <th className="px-6 py-4">Bot IA</th>
                                        <th className="px-6 py-4">Asesor</th>
                                        <th className="px-6 py-4 text-right">Detalles</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredContacts.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-12 text-slate-400 text-sm">
                                                No se encontraron contactos que coincidan con la búsqueda.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredContacts.map((contact) => {
                                            const isSelected = selectedContact?.id === contact.id;
                                            return (
                                                <tr 
                                                    key={contact.id}
                                                    className={`hover:bg-slate-50/70 transition-colors ${
                                                        isSelected ? 'bg-brand-teal-light/35' : ''
                                                    }`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-full bg-brand-teal-light border border-brand-teal/15 text-brand-teal font-extrabold flex items-center justify-center text-xs uppercase shadow-sm">
                                                                {contact.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-sm text-slate-800">{contact.name}</div>
                                                                <div className="text-[11px] text-slate-450 flex items-center gap-1.5 mt-0.5">
                                                                    <Phone className="h-3 w-3 text-slate-400" />
                                                                    <span className="font-semibold">{contact.whatsapp_phone}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${stageColors[contact.funnel_stage] || stageColors.new}`}>
                                                            {stageNames[contact.funnel_stage] || contact.funnel_stage}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${interestColors[contact.interest_level] || interestColors.low}`}>
                                                                {interestNames[contact.interest_level] || contact.interest_level}
                                                            </span>
                                                            <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-650">
                                                                <TrendingUp className="h-3.5 w-3.5 text-brand-teal" />
                                                                <span>{contact.lead_score} pts</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {contact.bot_paused ? (
                                                            <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md w-fit font-semibold">
                                                                <Pause className="h-3 w-3 animate-pulse text-amber-550" />
                                                                <span>Pausado</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md w-fit font-semibold">
                                                                <Bot className="h-3 w-3 text-emerald-600" />
                                                                <span>Activo</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-slate-550 font-semibold">
                                                        {contact.assigned_user ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <UserCheck className="h-3.5 w-3.5 text-brand-teal" />
                                                                <span>{contact.assigned_user.name ? contact.assigned_user.name.split(' ')[0] : '-'}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button 
                                                            onClick={() => setSelectedContact(contact)}
                                                            className="text-xs text-brand-teal hover:text-brand-teal/80 font-bold"
                                                        >
                                                            Ver Ficha
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right side contact details sidebar */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 min-h-[500px] flex flex-col justify-between shadow-sm">
                    {selectedContact ? (
                        <div className="space-y-6">
                            {/* Profile header */}
                            <div className="text-center">
                                <div className="mx-auto h-16 w-16 rounded-full bg-brand-teal text-white font-extrabold flex items-center justify-center text-xl uppercase shadow-md shadow-brand-teal/15 mb-3">
                                    {selectedContact.name.charAt(0)}
                                </div>
                                <h3 className="font-bold text-base text-slate-800">{selectedContact.name}</h3>
                                <p className="text-[10px] font-mono text-slate-400 mt-0.5">ID: WM-{selectedContact.id}</p>

                                <div className="flex items-center justify-center gap-2 mt-3">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${stageColors[selectedContact.funnel_stage] || stageColors.new}`}>
                                        {stageNames[selectedContact.funnel_stage]}
                                    </span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${interestColors[selectedContact.interest_level] || interestColors.low}`}>
                                        Interés: {interestNames[selectedContact.interest_level]}
                                    </span>
                                </div>
                            </div>

                            <div className="h-px bg-slate-100"></div>

                            {/* Contact info list */}
                            <div className="space-y-4 text-xs">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                                    <span className="font-mono font-semibold">{selectedContact.whatsapp_phone}</span>
                                </div>
                                {selectedContact.email && (
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                                        <span className="truncate font-semibold">{selectedContact.email}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-slate-650 font-semibold">
                                    <TrendingUp className="h-4 w-4 text-brand-teal shrink-0" />
                                    <span>Puntuación: <strong className="text-slate-850 font-mono font-bold">{selectedContact.lead_score}</strong> / 100</span>
                                </div>
                                {selectedContact.last_product && (
                                    <div className="flex items-center gap-3 text-slate-650 font-semibold">
                                        <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
                                        <span>Último Servicio: <strong className="text-slate-850 font-bold">{selectedContact.last_product.name}</strong></span>
                                    </div>
                                )}
                                {selectedContact.metadata && Object.keys(selectedContact.metadata).map((key) => (
                                    <div key={key} className="flex items-start gap-3 text-slate-605 capitalize font-semibold">
                                        <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                        <span>{key}: <strong className="text-slate-850 font-bold">{selectedContact.metadata[key]}</strong></span>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-slate-100"></div>

                            {/* Tags */}
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Tag className="h-3.5 w-3.5 text-slate-400" />
                                    Etiquetas del Lead
                                </h4>
                                {selectedContact.tags && selectedContact.tags.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedContact.tags.map((tag) => (
                                            <span 
                                                key={tag} 
                                                className="text-[9px] px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600 font-bold"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-350 italic">Sin etiquetas</span>
                                )}
                            </div>

                            <div className="h-px bg-slate-100"></div>

                            {/* Quick Action bot toggle */}
                            <div className="flex gap-2">
                                <button className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                                    selectedContact.bot_paused
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80 shadow-sm'
                                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80 shadow-sm'
                                }`}>
                                    {selectedContact.bot_paused ? (
                                        <>
                                            <Play className="h-3.5 w-3.5 text-emerald-600" />
                                            Reactivar Bot IA
                                        </>
                                    ) : (
                                        <>
                                            <Pause className="h-3.5 w-3.5 text-amber-600" />
                                            Pausar Bot IA
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="my-auto text-center py-12 text-slate-400 bg-slate-50/30 border border-dashed border-slate-200 rounded-xl p-4">
                            <AlertCircle className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                            <span className="text-xs font-semibold">Selecciona un contacto para ver su ficha técnica completa.</span>
                        </div>
                    )}

                    {selectedContact && (
                        <button 
                            onClick={() => setSelectedContact(null)}
                            className="mt-6 w-full text-center text-[10px] text-slate-400 hover:text-slate-600 underline font-bold"
                        >
                            Cerrar panel
                        </button>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
