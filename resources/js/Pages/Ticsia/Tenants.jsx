import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { 
    Building2, 
    Plus, 
    Search, 
    ExternalLink, 
    CheckCircle, 
    XCircle, 
    DollarSign, 
    Users, 
    Calendar,
    Settings,
    Edit2,
    Shield
} from 'lucide-react';

export default function Tenants({ tenants, impersonating, impersonated_tenant }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState(null);

    // Create form helper
    const createForm = useForm({
        name: '',
        slug: '',
        whatsapp_number: '',
        whatsmark_api_key: '',
        whatsmark_instance_id: '',
        n8n_webhook_url: '',
        timezone: 'America/Bogota',
        plan_name: 'free',
        subscription_expires_at: '',
    });

    // Edit form helper
    const editForm = useForm({
        name: '',
        whatsapp_number: '',
        whatsmark_api_key: '',
        whatsmark_instance_id: '',
        n8n_webhook_url: '',
        plan_name: 'free',
        subscription_status: 'active',
        subscription_expires_at: '',
        is_active: true,
    });

    // Handle Create Submit
    const handleCreateSubmit = (e) => {
        e.preventDefault();
        createForm.post(route('ticsia.tenants.store'), {
            onSuccess: () => {
                createForm.reset();
                setIsCreateModalOpen(false);
            }
        });
    };

    // Open Edit Modal
    const openEditModal = (tenant) => {
        setEditingTenant(tenant);
        editForm.setData({
            name: tenant.name,
            whatsapp_number: tenant.whatsapp_number || '',
            whatsmark_api_key: tenant.whatsmark_api_key || '',
            whatsmark_instance_id: tenant.whatsmark_instance_id || '',
            n8n_webhook_url: tenant.n8n_webhook_url || '',
            plan_name: tenant.plan_name || 'free',
            subscription_status: tenant.subscription_status || 'active',
            subscription_expires_at: tenant.subscription_expires_at ? tenant.subscription_expires_at.split('T')[0] : '',
            is_active: !!tenant.is_active,
        });
        setIsEditModalOpen(true);
    };

    // Handle Edit Submit
    const handleEditSubmit = (e) => {
        e.preventDefault();
        editForm.patch(route('ticsia.tenants.update', editingTenant.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
            }
        });
    };

    // Filter tenants
    const filteredTenants = tenants.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate metrics
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter(t => t.is_active).length;
    const totalContacts = tenants.reduce((acc, t) => acc + (t.contacts_count || 0), 0);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between w-full">
                    <h2 className="font-semibold text-xl text-slate-800 leading-tight">Panel Ticsia - Administración General</h2>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-emerald-500/10"
                    >
                        <Plus className="h-4.5 w-4.5" />
                        <span>Nuevo Comercio (Tenant)</span>
                    </button>
                </div>
            }
        >
            <Head title="Ticsia Admin Panel" />

            <div className="space-y-6">
                {/* Metrics row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl">
                        <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Total Comercios</span>
                            <div className="text-3xl font-bold text-white mt-1">{totalTenants}</div>
                        </div>
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                            <Building2 className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl">
                        <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Activos / En Producción</span>
                            <div className="text-3xl font-bold text-white mt-1">{activeTenants}</div>
                        </div>
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl">
                        <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Contactos Registrados</span>
                            <div className="text-3xl font-bold text-white mt-1">{totalContacts}</div>
                        </div>
                        <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
                            <Users className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Tenants Table Block */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                    {/* Search & Filter header */}
                    <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o slug..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-semibold"
                            />
                        </div>
                        <span className="text-xs text-slate-400 font-mono">Total encontrados: {filteredTenants.length}</span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase tracking-wider font-bold">
                                    <th className="px-6 py-4">Comercio</th>
                                    <th className="px-6 py-4">Instancia WhatsMark</th>
                                    <th className="px-6 py-4">Plan / Suscripción</th>
                                    <th className="px-6 py-4 text-center">Contactos</th>
                                    <th className="px-6 py-4 text-center">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-slate-350">
                                {filteredTenants.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-slate-950/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center font-bold text-white uppercase text-xs">
                                                    {tenant.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-white">{tenant.name}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{tenant.slug}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-400">
                                            {tenant.whatsmark_instance_id || <span className="text-slate-600">No configurado</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                                    tenant.plan_name === 'enterprise' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
                                                    tenant.plan_name === 'growth' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                                    'bg-slate-800 border-slate-700 text-slate-300'
                                                }`}>
                                                    {tenant.plan_name}
                                                </span>
                                                <div className="text-[10px] text-slate-500 mt-1 capitalize">
                                                    Estado: {tenant.subscription_status}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-semibold text-white text-sm">
                                            {tenant.contacts_count}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                                tenant.is_active ? 'text-emerald-400' : 'text-red-400'
                                            }`}>
                                                {tenant.is_active ? (
                                                    <CheckCircle className="h-4 w-4" />
                                                ) : (
                                                    <XCircle className="h-4 w-4" />
                                                )}
                                                <span>{tenant.is_active ? 'Activo' : 'Suspendido'}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(tenant)}
                                                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                                                    title="Editar Configuración"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                
                                                <Link
                                                    href={route('ticsia.impersonate', tenant.id)}
                                                    method="post"
                                                    as="button"
                                                    className="flex items-center gap-1 bg-brand-teal/10 hover:bg-brand-teal text-brand-teal hover:text-white border border-brand-teal/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                    <span>Suplantar</span>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {filteredTenants.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-12 text-slate-500 text-sm font-semibold">
                                            No se encontraron comercios registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Tenant Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative z-10 text-white animate-scale-up">
                        <h3 className="text-lg font-bold text-white mb-4">Registrar Nuevo Comercio</h3>
                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 font-semibold mb-1">Nombre del Comercio</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.data.name}
                                        onChange={e => createForm.setData('name', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 font-semibold mb-1">Subdominio / Slug</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.data.slug}
                                        onChange={e => createForm.setData('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 font-semibold mb-1">Número de WhatsApp</label>
                                    <input
                                        type="text"
                                        value={createForm.data.whatsapp_number}
                                        onChange={e => createForm.setData('whatsapp_number', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 font-semibold mb-1">WhatsMark Instancia ID</label>
                                    <input
                                        type="text"
                                        value={createForm.data.whatsmark_instance_id}
                                        onChange={e => createForm.setData('whatsmark_instance_id', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-400 font-semibold mb-1">WhatsMark API Key</label>
                                <input
                                    type="password"
                                    value={createForm.data.whatsmark_api_key}
                                    onChange={e => createForm.setData('whatsmark_api_key', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 font-semibold mb-1">Plan</label>
                                    <select
                                        value={createForm.data.plan_name}
                                        onChange={e => createForm.setData('plan_name', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                                    >
                                        <option value="free">Gratuito</option>
                                        <option value="starter">Plan Inicio (Starter)</option>
                                        <option value="growth">Plan Crecimiento (Growth)</option>
                                        <option value="enterprise">Plan Corporativo (Enterprise)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 font-semibold mb-1">Zona Horaria</label>
                                    <input
                                        type="text"
                                        value={createForm.data.timezone}
                                        onChange={e => createForm.setData('timezone', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-350 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                                >
                                    {createForm.processing ? 'Registrando...' : 'Registrar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Tenant Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative z-10 text-white animate-scale-up">
                        <h3 className="text-lg font-bold text-white mb-4">Editar Configuración: {editingTenant?.name}</h3>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 font-semibold mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.data.name}
                                        onChange={e => editForm.setData('name', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 font-semibold mb-1">Número de WhatsApp</label>
                                    <input
                                        type="text"
                                        value={editForm.data.whatsapp_number}
                                        onChange={e => editForm.setData('whatsapp_number', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 font-semibold mb-1">WhatsMark Instancia ID</label>
                                    <input
                                        type="text"
                                        value={editForm.data.whatsmark_instance_id}
                                        onChange={e => editForm.setData('whatsmark_instance_id', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 font-semibold mb-1">N8N Webhook URL</label>
                                    <input
                                        type="text"
                                        value={editForm.data.n8n_webhook_url}
                                        onChange={e => editForm.setData('n8n_webhook_url', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-400 font-semibold mb-1">WhatsMark API Key</label>
                                <input
                                    type="password"
                                    value={editForm.data.whatsmark_api_key}
                                    placeholder="Dejar vacío para no modificar..."
                                    onChange={e => editForm.setData('whatsmark_api_key', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 font-semibold mb-1">Plan</label>
                                    <select
                                        value={editForm.data.plan_name}
                                        onChange={e => editForm.setData('plan_name', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                                    >
                                        <option value="free">Gratuito</option>
                                        <option value="starter">Starter</option>
                                        <option value="growth">Growth</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 font-semibold mb-1">Estado de Pago</label>
                                    <select
                                        value={editForm.data.subscription_status}
                                        onChange={e => editForm.setData('subscription_status', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                                    >
                                        <option value="active">Activo</option>
                                        <option value="suspended">Suspendido</option>
                                        <option value="trial_expired">Demo Vencida</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 font-semibold mb-1">Vence el</label>
                                    <input
                                        type="date"
                                        value={editForm.data.subscription_expires_at}
                                        onChange={e => editForm.setData('subscription_expires_at', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={editForm.data.is_active}
                                    onChange={e => editForm.setData('is_active', e.target.checked)}
                                    className="rounded border-slate-800 text-emerald-500 bg-slate-950 focus:ring-emerald-500/20"
                                />
                                <label htmlFor="is_active" className="text-xs text-slate-400 font-semibold">Comercio Activo en Producción</label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-350 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                                >
                                    {editForm.processing ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
