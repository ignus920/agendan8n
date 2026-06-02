import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
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
    TrendingUp,
    Edit3,
    Megaphone,
    X
} from 'lucide-react';

export default function ContactsIndex({ contacts }) {
    const [search, setSearch] = useState('');
    const [selectedTab, setSelectedTab] = useState('all'); // all, hot, customers, lost
    const [selectedContact, setSelectedContact] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [activeDetailTab, setActiveDetailTab] = useState('profile'); // profile, logs

    const getEventDetails = (log) => {
        switch (log.event_type) {
            case 'contact_created':
                return {
                    title: 'Contacto Creado',
                    icon: UserCheck,
                    color: 'border-emerald-200 text-emerald-600 bg-emerald-50'
                };
            case 'funnel_stage_changed':
                return {
                    title: 'Etapa del Embudo',
                    icon: Briefcase,
                    color: 'border-blue-200 text-blue-600 bg-blue-50'
                };
            case 'lead_score_changed':
                return {
                    title: 'Scoring de Lead',
                    icon: TrendingUp,
                    color: 'border-amber-200 text-amber-600 bg-amber-50'
                };
            case 'interest_level_changed':
                return {
                    title: 'Nivel de Interés',
                    icon: Flame,
                    color: 'border-red-200 text-red-600 bg-red-50'
                };
            case 'campaign_assigned':
                return {
                    title: 'Seguimiento Iniciado',
                    icon: Megaphone,
                    color: 'border-purple-250 text-purple-600 bg-purple-50'
                };
            default:
                return {
                    title: log.event_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                    icon: Bot,
                    color: 'border-slate-200 text-slate-505 bg-slate-50'
                };
        }
    };

    const groupLogsByDate = (logs) => {
        if (!logs || logs.length === 0) return {};
        const groups = {};
        logs.forEach(log => {
            if (!log.executed_at) return;
            const date = new Date(log.executed_at);
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);
            
            let dateStr = '';
            if (date.toDateString() === today.toDateString()) {
                dateStr = 'Hoy';
            } else if (date.toDateString() === yesterday.toDateString()) {
                dateStr = 'Ayer';
            } else {
                dateStr = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
            }
            
            if (!groups[dateStr]) {
                groups[dateStr] = [];
            }
            groups[dateStr].push(log);
        });
        return groups;
    };

    const { data, setData, put, processing, errors, reset, clearErrors, transform } = useForm({
        name: '',
        email: '',
        whatsapp_phone: '',
        funnel_stage: 'new',
        interest_level: 'unknown',
        tags_input: '',
    });

    transform((data) => ({
        ...data,
        tags: data.tags_input ? data.tags_input.split(',').map(t => t.trim()).filter(Boolean) : [],
    }));

    useEffect(() => {
        if (selectedContact && !isEditing) {
            const updatedContact = contacts.find(c => c.id === selectedContact.id);
            if (updatedContact) setSelectedContact(updatedContact);
        }
    }, [contacts, isEditing]);

    const toggleBotPause = (contact) => {
        router.put(route('contacts.update', contact.id), {
            name: contact.name,
            email: contact.email,
            whatsapp_phone: contact.whatsapp_phone,
            funnel_stage: contact.funnel_stage,
            interest_level: contact.interest_level,
            tags: contact.tags,
            bot_paused: !contact.bot_paused,
        }, {
            preserveScroll: true,
        });
    };

    const handleEditClick = () => {
        setData({
            name: selectedContact.name || '',
            email: selectedContact.email || '',
            whatsapp_phone: selectedContact.whatsapp_phone || '',
            funnel_stage: selectedContact.funnel_stage || 'new',
            interest_level: selectedContact.interest_level || 'unknown',
            tags_input: Array.isArray(selectedContact.tags) ? selectedContact.tags.join(', ') : '',
        });
        clearErrors();
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        reset();
        clearErrors();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('contacts.update', selectedContact.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditing(false);
            },
        });
    };

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
                                                            onClick={() => {
                                                                setSelectedContact(contact);
                                                                setActiveDetailTab('profile');
                                                            }}
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
                        isEditing ? (
                            <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-5">
                                <h3 className="font-bold text-base text-slate-800 mb-2 flex items-center gap-2">
                                    <Edit3 className="h-4 w-4 text-brand-teal" />
                                    Editar Contacto
                                </h3>
                                
                                <div className="space-y-4 flex-1 pr-1">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre *</label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors"
                                        />
                                        {errors.name && <div className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.name}</div>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teléfono</label>
                                        <input
                                            type="text"
                                            value={data.whatsapp_phone}
                                            onChange={e => setData('whatsapp_phone', e.target.value)}
                                            className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors"
                                        />
                                        {errors.whatsapp_phone && <div className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.whatsapp_phone}</div>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors"
                                        />
                                        {errors.email && <div className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.email}</div>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fase</label>
                                            <select
                                                value={data.funnel_stage}
                                                onChange={e => setData('funnel_stage', e.target.value)}
                                                className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors"
                                            >
                                                {Object.entries(stageNames).map(([key, value]) => (
                                                    <option key={key} value={key}>{value}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Interés</label>
                                            <select
                                                value={data.interest_level}
                                                onChange={e => setData('interest_level', e.target.value)}
                                                className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors"
                                            >
                                                {Object.entries(interestNames).map(([key, value]) => (
                                                    <option key={key} value={key}>{value}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Etiquetas (separadas por coma)</label>
                                        <input
                                            type="text"
                                            value={data.tags_input}
                                            onChange={e => setData('tags_input', e.target.value)}
                                            placeholder="ej: vip, interesado"
                                            className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors"
                                        />
                                        {errors.tags_input && <div className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.tags_input}</div>}
                                    </div>
                                </div>
                                
                                <div className="pt-4 flex gap-3 border-t border-slate-100 mt-auto">
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="flex-1 px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 px-4 py-2 bg-brand-teal hover:bg-brand-teal/90 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        {processing && <span className="h-3 w-3 border-2 border-white border-t-transparent animate-spin rounded-full"></span>}
                                        Guardar Cambios
                                    </button>
                                </div>
                             </form>
                        ) : (
                        <div className="space-y-5 flex flex-col h-full">
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

                            {/* Details Tabs */}
                            <div className="flex border-b border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setActiveDetailTab('profile')}
                                    className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition-all ${
                                        activeDetailTab === 'profile'
                                            ? 'border-brand-teal text-brand-teal'
                                            : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    Ficha Técnica
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveDetailTab('logs')}
                                    className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                                        activeDetailTab === 'logs'
                                            ? 'border-brand-teal text-brand-teal'
                                            : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    Bitácora
                                    <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-extrabold ${
                                        activeDetailTab === 'logs'
                                            ? 'bg-brand-teal/10 text-brand-teal'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {selectedContact.automation_logs ? selectedContact.automation_logs.length : 0}
                                    </span>
                                </button>
                            </div>

                            {/* Tab Content */}
                            {activeDetailTab === 'logs' ? (
                                <div className="space-y-4 flex-1 overflow-y-auto max-h-[350px] pr-1 scrollbar-thin">
                                    {(!selectedContact.automation_logs || selectedContact.automation_logs.length === 0) ? (
                                        <div className="text-center py-10 text-slate-400 bg-slate-50/55 border border-dashed border-slate-200 rounded-2xl p-4">
                                            <AlertCircle className="mx-auto h-6 w-6 text-slate-300 mb-1.5" />
                                            <span className="text-[11px] font-semibold">Sin registros de actividad aún.</span>
                                        </div>
                                    ) : (
                                        Object.entries(groupLogsByDate(selectedContact.automation_logs)).map(([dateStr, logs]) => (
                                            <div key={dateStr} className="space-y-2.5">
                                                {/* Date Header */}
                                                <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider sticky top-0 bg-white py-0.5 z-10">
                                                    {dateStr}
                                                </div>
                                                
                                                {/* Timeline Items */}
                                                <div className="relative pl-4 border-l border-slate-100 ml-1.5 space-y-3">
                                                    {logs.map((log) => {
                                                        const eventDetails = getEventDetails(log);
                                                        const IconComponent = eventDetails.icon;
                                                        
                                                        return (
                                                            <div key={log.id} className="relative">
                                                                {/* Bullet Point */}
                                                                <span className={`absolute -left-[21.5px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border bg-white shadow-sm ${eventDetails.color}`}>
                                                                    <IconComponent className="h-2.5 w-2.5" />
                                                                </span>
                                                                
                                                                <div className="text-xs">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <span className="font-bold text-slate-700">{eventDetails.title}</span>
                                                                        <span className="text-[9px] font-semibold text-slate-400 font-mono">
                                                                            {new Date(log.executed_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[11px] text-slate-550 mt-0.5 leading-relaxed">
                                                                        {log.actions_executed?.description || log.error_message || 'Acción ejecutada'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-5 flex-1">
                                    {/* Contact info list */}
                                    <div className="space-y-3.5 text-xs">
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
                                    <div className="flex gap-2 mt-auto">
                                        <button 
                                            type="button"
                                            onClick={() => toggleBotPause(selectedContact)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
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
                                        
                                        <button 
                                            type="button"
                                            onClick={handleEditClick}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all shadow-sm"
                                        >
                                            <Edit3 className="h-3.5 w-3.5" />
                                            Editar Info
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        )
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
