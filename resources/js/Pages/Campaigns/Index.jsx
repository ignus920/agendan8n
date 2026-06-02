import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { 
    Megaphone, 
    Plus, 
    Trash2, 
    Edit3, 
    Send, 
    Calendar, 
    BarChart3, 
    Users, 
    MessageSquare, 
    CheckCircle2, 
    Eye,
    Sliders,
    X,
    AlertCircle
} from 'lucide-react';

export default function CampaignsIndex({ campaigns, contacts, whatsmarkCampaigns = [], statuses }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);
    const [selectedCampaignForRecipients, setSelectedCampaignForRecipients] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors, transform } = useForm({
        name: '',
        whatsmark_campaign_id: '',
        segment_filters: { funnel_stage: '', interest_level: '', tag: '', min_score: '', max_score: '', inactive_days: '' },
        scheduled_at: '',
        daily_limit: 100,
        status: 'draft',
    });

    const openCreateModal = () => {
        setEditingCampaign(null);
        clearErrors();
        reset();
        if (whatsmarkCampaigns.length > 0) {
            setData('whatsmark_campaign_id', whatsmarkCampaigns[0].id);
        }
        setIsModalOpen(true);
    };

    const openEditModal = (campaign) => {
        setEditingCampaign(campaign);
        clearErrors();
        setData({
            name: campaign.name || '',
            whatsmark_campaign_id: campaign.whatsmark_campaign_id || '',
            segment_filters: campaign.segment_filters || { funnel_stage: '', interest_level: '', tag: '', min_score: '', max_score: '', inactive_days: '' },
            scheduled_at: campaign.scheduled_at ? campaign.scheduled_at.replace('.000000Z', '').slice(0, 16) : '',
            daily_limit: campaign.daily_limit || 100,
            status: campaign.status,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCampaign(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        transform((currentData) => {
            // Always reset status to draft/scheduled when saving so it can be sent again
            let newStatus = currentData.scheduled_at ? 'scheduled' : 'draft';
            return { ...currentData, status: newStatus };
        });

        if (editingCampaign) {
            put(route('campaigns.update', editingCampaign.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('campaigns.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (campaignId) => {
        if (confirm('¿Estás seguro de que deseas eliminar esta campaña?')) {
            destroy(route('campaigns.destroy', campaignId));
        }
    };

    const handleSendNow = (campaignId) => {
        if (confirm('¿Deseas enviar esta campaña ahora mismo a los contactos segmentados?')) {
            router.post(route('campaigns.send', campaignId), {}, {
                onSuccess: (page) => {
                    if (page.props.flash?.error) {
                        alert(page.props.flash.error);
                    }
                }
            });
        }
    };

    // Calculate segment count based on filters
    const calculateSegmentEstimate = (filters) => {
        return contacts.filter(contact => {
            if (filters.funnel_stage && contact.funnel_stage !== filters.funnel_stage) return false;
            if (filters.interest_level && contact.interest_level !== filters.interest_level) return false;
            if (filters.tag) {
                const tagsArr = Array.isArray(contact.tags) ? contact.tags : [];
                if (!tagsArr.some(t => t.toLowerCase().includes(filters.tag.toLowerCase()))) return false;
            }
            if (filters.min_score !== undefined && filters.min_score !== '' && contact.lead_score < parseInt(filters.min_score)) return false;
            if (filters.max_score !== undefined && filters.max_score !== '' && contact.lead_score > parseInt(filters.max_score)) return false;
            return true;
        }).length;
    };

    // Stats calculations
    const totalSent = campaigns.reduce((acc, c) => acc + c.sent_count, 0);
    const totalDelivered = campaigns.reduce((acc, c) => acc + c.delivered_count, 0);
    const totalRead = campaigns.reduce((acc, c) => acc + c.read_count, 0);
    const avgDeliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;
    const avgReadRate = totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0;

    const getStatusColor = (status) => {
        switch (status) {
            case 'draft':
                return 'bg-slate-100 text-slate-650 border-slate-205';
            case 'scheduled':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'sending':
                return 'bg-amber-50 text-amber-705 border-amber-200';
            case 'sent':
                return 'bg-emerald-50 text-emerald-700 border-emerald-250';
            case 'cancelled':
                return 'bg-red-50 text-red-700 border-red-200';
            default:
                return 'bg-slate-50 text-slate-500 border-slate-200';
        }
    };

    const getStatusLabel = (status) => {
        return statuses[status] || status;
    };

    const funnelStageLabels = {
        'new': 'Nuevo',
        'interested': 'Interesado',
        'qualified': 'Calificado',
        'negotiation': 'Negociación',
        'customer': 'Cliente',
        'lost': 'Perdido',
        'demo_scheduling': 'Agenda Incompleta (Demo)',
        'demo_booking_select': 'Seleccionando Horario (Demo)',
        'demo_cta': 'Llamado a Acción (Demo)',
        'profile_taller': 'Perfil: Taller',
        'profile_clinica': 'Perfil: Clínica',
        'profile_turismo': 'Perfil: Turismo',
        'profile_otro': 'Perfil: Otro'
    };

    const interestLevelLabels = {
        'low': 'Bajo',
        'medium': 'Medio',
        'high': 'Alto',
        'hot': 'Caliente (Hot)'
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            Campañas de Mensajería
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Envía campañas masivas o programadas en base a plantillas de WhatsApp homologadas.</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-bold shadow-md hover:bg-brand-teal/95 hover:shadow-lg transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Nueva Campaña
                    </button>
                </div>
            }
        >
            <Head title="Campañas" />

            {/* Campaign Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {/* Stats 1 */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-brand-teal-light text-brand-teal flex items-center justify-center shadow-sm shrink-0">
                        <Megaphone className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Campañas</span>
                        <span className="text-lg font-extrabold text-slate-800">{campaigns.length}</span>
                    </div>
                </div>

                {/* Stats 2 */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm shrink-0">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Enviados</span>
                        <span className="text-lg font-extrabold text-slate-800">{totalSent}</span>
                    </div>
                </div>

                {/* Stats 3 */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm shrink-0">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Entrega Promedio</span>
                        <span className="text-lg font-extrabold text-slate-800">{avgDeliveryRate}%</span>
                    </div>
                </div>

                {/* Stats 4 */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-brand-orange-light text-brand-orange flex items-center justify-center shadow-sm shrink-0">
                        <Eye className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Lectura Promedio</span>
                        <span className="text-lg font-extrabold text-slate-800">{avgReadRate}%</span>
                    </div>
                </div>
            </div>

            {/* Campaign Table Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Campaña</th>
                                <th className="px-6 py-4">Plantilla / Params</th>
                                <th className="px-6 py-4">Segmentación</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Rendimiento (Lectura / Entrega / Total)</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {campaigns.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-slate-400 text-sm">
                                        No hay campañas de mensajería creadas aún.
                                    </td>
                                </tr>
                            ) : (
                                campaigns.map((campaign) => {
                                    const deliveryPercent = campaign.sent_count > 0 ? Math.round((campaign.delivered_count / campaign.sent_count) * 100) : 0;
                                    const readPercent = campaign.delivered_count > 0 ? Math.round((campaign.read_count / campaign.delivered_count) * 100) : 0;

                                    return (
                                        <tr key={campaign.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-sm text-slate-800">{campaign.name}</div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: CAM-{campaign.id}</div>
                                            </td>
                                            
                                            <td className="px-6 py-4">
                                                <span className="bg-slate-100 text-slate-650 px-2 py-0.5 rounded-lg text-xs font-semibold font-mono border border-slate-200">
                                                    {campaign.template_name}
                                                </span>
                                                {campaign.template_params && Object.keys(campaign.template_params).length > 0 && (
                                                    <div className="text-[10px] text-slate-450 mt-1.5 space-y-0.5">
                                                        {Object.entries(campaign.template_params).map(([k, v]) => (
                                                            <div key={k} className="truncate">
                                                                <strong>{k}</strong>: {v}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 space-y-1">
                                                {campaign.segment_filters && Object.keys(campaign.segment_filters).some(k => campaign.segment_filters[k]) ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {campaign.segment_filters.funnel_stage && (
                                                            <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-150 px-1.5 py-0.5 rounded-md font-semibold">
                                                                Etapa: {funnelStageLabels[campaign.segment_filters.funnel_stage] || campaign.segment_filters.funnel_stage}
                                                            </span>
                                                        )}
                                                        {campaign.segment_filters.interest_level && (
                                                            <span className="text-[10px] bg-brand-orange-light text-brand-orange border border-brand-orange/20 px-1.5 py-0.5 rounded-md font-semibold">
                                                                Interés: {interestLevelLabels[campaign.segment_filters.interest_level] || campaign.segment_filters.interest_level}
                                                            </span>
                                                        )}
                                                        {campaign.segment_filters.tag && (
                                                            <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-md font-semibold">
                                                                Tag: {campaign.segment_filters.tag}
                                                            </span>
                                                        )}
                                                        {campaign.segment_filters.min_score !== undefined && campaign.segment_filters.min_score !== '' && (
                                                            <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-150 px-1.5 py-0.5 rounded-md font-semibold">
                                                                Score Min: {campaign.segment_filters.min_score}
                                                            </span>
                                                        )}
                                                        {campaign.segment_filters.max_score !== undefined && campaign.segment_filters.max_score !== '' && (
                                                            <span className="text-[10px] bg-red-50 text-red-605 border border-red-150 px-1.5 py-0.5 rounded-md font-semibold">
                                                                Score Max: {campaign.segment_filters.max_score}
                                                            </span>
                                                        )}
                                                        {campaign.segment_filters.inactive_days !== undefined && campaign.segment_filters.inactive_days !== '' && (
                                                            <span className="text-[10px] bg-amber-50 text-amber-705 border border-amber-150 px-1.5 py-0.5 rounded-md font-semibold">
                                                                Días Inactivo: {campaign.segment_filters.inactive_days}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Todos los contactos</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(campaign.status)}`}>
                                                    {getStatusLabel(campaign.status)}
                                                </span>
                                                {campaign.scheduled_at && campaign.status === 'scheduled' && (
                                                    <div className="text-[9.5px] text-slate-400 flex items-center gap-1 mt-1.5 font-mono">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(campaign.scheduled_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                {campaign.status === 'sent' || campaign.sent_count > 0 ? (
                                                    <div className="w-48">
                                                        {/* Progress bar */}
                                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex mb-2 border border-slate-200/50">
                                                            <div style={{ width: `${deliveryPercent}%` }} className="bg-emerald-500 h-full" title={`Entregados: ${deliveryPercent}%`}></div>
                                                            <div style={{ width: `${readPercent}%` }} className="bg-brand-teal h-full" title={`Leídos: ${readPercent}%`}></div>
                                                        </div>
                                                        
                                                        {/* Details */}
                                                        <div className="grid grid-cols-3 text-[10px] font-semibold text-slate-500 text-center divide-x divide-slate-100">
                                                            <div 
                                                                className={campaign.recipients && campaign.recipients.length > 0 ? "cursor-pointer hover:bg-slate-50 p-1 rounded transition-all" : ""}
                                                                onClick={() => {
                                                                    if (campaign.recipients && campaign.recipients.length > 0) {
                                                                        setSelectedCampaignForRecipients(campaign);
                                                                    }
                                                                }}
                                                                title={campaign.recipients && campaign.recipients.length > 0 ? "Hacer clic para ver destinatarios" : ""}
                                                            >
                                                                <div className="text-slate-850 font-extrabold underline decoration-dotted hover:text-brand-teal transition-colors">
                                                                    {campaign.sent_count}
                                                                </div>
                                                                <div>Enviados</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-emerald-600 font-extrabold">{deliveryPercent}%</div>
                                                                <div>Entreg.</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-brand-teal font-extrabold">{readPercent}%</div>
                                                                <div>Leídos</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Sin datos de rendimiento</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex gap-2 justify-end">
                                                    {campaign.status !== 'sent' && campaign.status !== 'sending' && (
                                                        <button
                                                            onClick={() => handleSendNow(campaign.id)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-teal hover:bg-brand-teal/95 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                                            title="Enviar Campaña Ahora"
                                                        >
                                                            <Send className="h-3.5 w-3.5" />
                                                            Enviar
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => openEditModal(campaign)}
                                                        className="p-1.5 text-slate-500 hover:text-brand-teal hover:bg-slate-100 rounded-lg border border-transparent transition-colors"
                                                        title="Editar Campaña"
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(campaign.id)}
                                                        className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-slate-100 rounded-lg border border-transparent transition-colors"
                                                        title="Eliminar Campaña"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Slide-out Panel or Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>

                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-lg animate-fade-in-up">
                            
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <Megaphone className="h-5 w-5 text-brand-teal" />
                                    {editingCampaign ? 'Editar Campaña' : 'Nueva Campaña'}
                                </h3>
                                <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Modal Body / Form */}
                            <form onSubmit={handleSubmit}>
                                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre de la Campaña *</label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            placeholder="Ej. Promoción Especial de Recompra Mayo"
                                            className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors"
                                            required
                                        />
                                        {errors.name && <div className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.name}</div>}
                                    </div>

                                    {/* WhatsMark Campaign Select */}
                                        <div className="mt-4">
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Campaña de WhatsMark *</label>
                                            <select
                                                value={data.whatsmark_campaign_id}
                                                onChange={e => setData('whatsmark_campaign_id', e.target.value)}
                                                className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors"
                                                required
                                            >
                                                <option value="">Selecciona una campaña...</option>
                                                {whatsmarkCampaigns.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name} {c.template_name ? `(${c.template_name})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.whatsmark_campaign_id && (
                                                <div className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.whatsmark_campaign_id}
                                                </div>
                                            )}
                                        </div>

                                    {/* Segment Filters */}
                                    <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                                                <Users className="h-4 w-4 text-blue-500" />
                                                Filtros de Segmentación
                                            </h4>
                                            <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                                Est. {calculateSegmentEstimate(data.segment_filters)} contactos
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Etapa de Embudo</label>
                                                <select
                                                    value={data.segment_filters.funnel_stage || ''}
                                                    onChange={e => setData('segment_filters', { ...data.segment_filters, funnel_stage: e.target.value })}
                                                    className="block w-full px-2 py-1.5 border border-slate-250 rounded-xl bg-white text-xs focus:outline-none focus:border-brand-teal transition-colors"
                                                >
                                                    <option value="">Todos</option>
                                                    <option value="new">Nuevo</option>
                                                    <option value="interested">Interesado</option>
                                                    <option value="qualified">Calificado</option>
                                                    <option value="negotiation">Negociación</option>
                                                    <option value="customer">Cliente</option>
                                                    <option value="lost">Perdido</option>
                                                    <option value="demo_scheduling">Agenda Incompleta (Demo)</option>
                                                    <option value="demo_booking_select">Seleccionando Horario (Demo)</option>
                                                    <option value="demo_cta">Llamado a Acción (Demo)</option>
                                                    <option value="profile_taller">Perfil: Taller</option>
                                                    <option value="profile_clinica">Perfil: Clínica</option>
                                                    <option value="profile_turismo">Perfil: Turismo</option>
                                                    <option value="profile_otro">Perfil: Otro</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nivel de Interés</label>
                                                <select
                                                    value={data.segment_filters.interest_level || ''}
                                                    onChange={e => setData('segment_filters', { ...data.segment_filters, interest_level: e.target.value })}
                                                    className="block w-full px-2 py-1.5 border border-slate-250 rounded-xl bg-white text-xs focus:outline-none focus:border-brand-teal transition-colors"
                                                >
                                                    <option value="">Todos</option>
                                                    <option value="low">Bajo</option>
                                                    <option value="medium">Medio</option>
                                                    <option value="high">Alto</option>
                                                    <option value="hot">Caliente (Hot)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Etiqueta (Tag)</label>
                                                <input
                                                    type="text"
                                                    value={data.segment_filters.tag || ''}
                                                    onChange={e => setData('segment_filters', { ...data.segment_filters, tag: e.target.value })}
                                                    placeholder="ej: vip"
                                                    className="block w-full px-2 py-1.5 border border-slate-250 rounded-xl bg-white text-xs focus:outline-none focus:border-brand-teal transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mínimo Score</label>
                                                <input
                                                    type="number"
                                                    value={data.segment_filters.min_score || ''}
                                                    onChange={e => setData('segment_filters', { ...data.segment_filters, min_score: e.target.value })}
                                                    placeholder="Ej: 50"
                                                    min="0"
                                                    className="block w-full px-2 py-1.5 border border-slate-250 rounded-xl bg-white text-xs focus:outline-none focus:border-brand-teal transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Máximo Score</label>
                                                <input
                                                    type="number"
                                                    value={data.segment_filters.max_score || ''}
                                                    onChange={e => setData('segment_filters', { ...data.segment_filters, max_score: e.target.value })}
                                                    placeholder="Ej: 100"
                                                    min="0"
                                                    className="block w-full px-2 py-1.5 border border-slate-250 rounded-xl bg-white text-xs focus:outline-none focus:border-brand-teal transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Días de Inactividad</label>
                                                <input
                                                    type="number"
                                                    value={data.segment_filters.inactive_days || ''}
                                                    onChange={e => setData('segment_filters', { ...data.segment_filters, inactive_days: e.target.value })}
                                                    placeholder="Ej: 2"
                                                    min="0"
                                                    className="block w-full px-2 py-1.5 border border-slate-250 rounded-xl bg-white text-xs focus:outline-none focus:border-brand-teal transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Scheduled At & Daily Limit */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Programar Envío (Opcional)</label>
                                            <input
                                                type="datetime-local"
                                                value={data.scheduled_at}
                                                onChange={e => setData('scheduled_at', e.target.value)}
                                                className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors font-mono"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Límite Diario de Mensajes</label>
                                            <input
                                                type="number"
                                                value={data.daily_limit}
                                                onChange={e => setData('daily_limit', e.target.value)}
                                                min="10"
                                                className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2 bg-brand-teal hover:bg-brand-teal/90 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-1.5"
                                    >
                                        {processing && <span className="h-3 w-3 border-2 border-white border-t-transparent animate-spin rounded-full"></span>}
                                        {editingCampaign ? 'Guardar Cambios' : 'Crear Campaña'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* View Recipients Modal */}
            {selectedCampaignForRecipients && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedCampaignForRecipients(null)}></div>
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-lg animate-fade-in-up">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-base font-bold text-slate-850 flex items-center gap-2">
                                    <Users className="h-5 w-5 text-brand-teal" />
                                    <span>Destinatarios de la Campaña</span>
                                </h3>
                                <button onClick={() => setSelectedCampaignForRecipients(null)} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                                <div className="text-xs text-slate-500 mb-2">
                                    Mostrando los destinatarios de la campaña: <strong className="text-slate-700">{selectedCampaignForRecipients.name}</strong>
                                </div>
                                <div className="border border-slate-150 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                                <th className="px-4 py-3">Cliente</th>
                                                <th className="px-4 py-3">WhatsApp</th>
                                                <th className="px-4 py-3 text-center">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {selectedCampaignForRecipients.recipients.map((recipient) => (
                                                <tr key={recipient.id} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 font-semibold text-slate-850">
                                                        {recipient.contact?.name || 'Cliente sin nombre'}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-slate-500">
                                                        {recipient.contact?.whatsapp_phone || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                            recipient.status === 'sent' 
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                                : 'bg-red-50 text-red-700 border-red-200'
                                                        }`}>
                                                            {recipient.status === 'sent' ? 'Entregado' : 'Falló'}
                                                        </span>
                                                        {recipient.error_message && (
                                                            <div className="text-[9px] text-red-500 mt-0.5 truncate max-w-[120px] mx-auto" title={recipient.error_message}>
                                                                {recipient.error_message}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end rounded-b-2xl">
                                <button
                                    onClick={() => setSelectedCampaignForRecipients(null)}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
