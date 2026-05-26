import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { 
    Users, 
    Plus, 
    Trash2, 
    Edit3, 
    Video, 
    Phone, 
    Home, 
    Car, 
    Wrench,
    Check, 
    AlertCircle,
    X,
    Briefcase
} from 'lucide-react';

export default function ResourcesIndex({ resources, types }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        type: 'person',
        description: '',
        capacity: 1,
        is_active: true,
        whatsapp: '',
        meeting_url: '',
        location: '',
    });

    const openCreateModal = () => {
        setEditingResource(null);
        clearErrors();
        reset();
        setIsModalOpen(true);
    };

    const openEditModal = (resource) => {
        setEditingResource(resource);
        clearErrors();
        
        const metadata = resource.metadata || {};
        setData({
            name: resource.name || '',
            type: resource.type || 'person',
            description: resource.description || '',
            capacity: resource.capacity || 1,
            is_active: !!resource.is_active,
            whatsapp: metadata.whatsapp || '',
            meeting_url: metadata.url || metadata.meeting_url || '',
            location: metadata.location || '',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingResource(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Assemble metadata
        const metadata = {};
        if (data.type === 'person' && data.whatsapp) {
            metadata.whatsapp = data.whatsapp;
        }
        if (data.type === 'room') {
            if (data.meeting_url) metadata.url = data.meeting_url;
            if (data.location) metadata.location = data.location;
        }

        const payload = {
            name: data.name,
            type: data.type,
            description: data.description,
            capacity: data.capacity,
            is_active: data.is_active,
            metadata,
        };

        if (editingResource) {
            put(route('resources.update', editingResource.id), {
                data: payload,
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('resources.store'), {
                data: payload,
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (resourceId) => {
        if (confirm('¿Estás seguro de que deseas eliminar este recurso?')) {
            destroy(route('resources.destroy', resourceId));
        }
    };

    // Return appropriate icon depending on resource type
    const getTypeIcon = (type) => {
        switch (type) {
            case 'person':
                return <Users className="h-5 w-5 text-brand-teal" />;
            case 'room':
                return <Home className="h-5 w-5 text-blue-500" />;
            case 'equipment':
                return <Wrench className="h-5 w-5 text-amber-500" />;
            case 'vehicle':
                return <Car className="h-5 w-5 text-indigo-500" />;
            default:
                return <Briefcase className="h-5 w-5 text-slate-400" />;
        }
    };

    const getTypeLabel = (type) => {
        return types[type] || type;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            Asesores y Recursos
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Gestiona el personal y los recursos disponibles para la asignación automática de citas.</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-bold shadow-md hover:bg-brand-teal/95 hover:shadow-lg transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Recurso
                    </button>
                </div>
            }
        >
            <Head title="Recursos" />

            {resources.length === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm max-w-xl mx-auto mt-6">
                    <div className="h-12 w-12 rounded-2xl bg-brand-teal-light text-brand-teal flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-850">No hay asesores o recursos registrados</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                        Crea asesores o salas de reuniones para que tus clientes puedan elegir con quién agendar su cita de WhatsApp.
                    </p>
                    <button
                        onClick={openCreateModal}
                        className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-bold shadow-md hover:bg-brand-teal/90 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Registrar Recurso
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resources.map((resource) => {
                        const metadata = resource.metadata || {};
                        return (
                            <div 
                                key={resource.id} 
                                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-350 transition-all flex flex-col group"
                            >
                                {/* Card Body */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        {/* Icon & Type label */}
                                        <div className="flex items-center gap-2">
                                            <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center shadow-sm">
                                                {getTypeIcon(resource.type)}
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-semibold">
                                                    {getTypeLabel(resource.type)}
                                                </span>
                                                <h4 className="font-bold text-slate-800 text-sm group-hover:text-brand-teal transition-colors">
                                                    {resource.name}
                                                </h4>
                                            </div>
                                        </div>

                                        {/* Active Badge */}
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border shadow-sm ${
                                            resource.is_active 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' 
                                                : 'bg-slate-100 text-slate-500 border-slate-200/80'
                                        }`}>
                                            {resource.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                                        {resource.description || 'Sin descripción adicional.'}
                                    </p>

                                    {/* Metadata Information (WhatsApp/Meeting details) */}
                                    <div className="mt-auto space-y-2 pt-3 border-t border-slate-100 text-[11px] text-slate-650">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Capacidad Simultánea:</span>
                                            <span className="font-bold text-slate-700">{resource.capacity} {resource.capacity === 1 ? 'cita' : 'citas'}</span>
                                        </div>

                                        {resource.type === 'person' && metadata.whatsapp && (
                                            <div className="flex items-center gap-1.5 text-slate-750">
                                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                <span>WhatsApp: <strong className="font-mono">{metadata.whatsapp}</strong></span>
                                            </div>
                                        )}

                                        {resource.type === 'room' && (metadata.url || metadata.meeting_url) && (
                                            <div className="flex items-center gap-1.5 text-slate-750">
                                                <Video className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                <span className="truncate">
                                                    Enlace: <a href={metadata.url || metadata.meeting_url} target="_blank" rel="noopener noreferrer" className="text-brand-teal hover:underline font-semibold">{metadata.url || metadata.meeting_url}</a>
                                                </span>
                                            </div>
                                        )}

                                        {resource.type === 'room' && metadata.location && (
                                            <div className="flex items-center gap-1.5 text-slate-750">
                                                <Home className="h-3.5 w-3.5 text-slate-400" />
                                                <span>Ubicación: <strong>{metadata.location}</strong></span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Footer Actions */}
                                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end">
                                    <button
                                        onClick={() => openEditModal(resource)}
                                        className="p-1.5 text-slate-500 hover:text-brand-teal hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors"
                                        title="Editar Recurso"
                                    >
                                        <Edit3 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(resource.id)}
                                        className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors"
                                        title="Eliminar Recurso"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

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
                                    <Briefcase className="h-5 w-5 text-brand-teal" />
                                    {editingResource ? 'Editar Recurso' : 'Nuevo Recurso'}
                                </h3>
                                <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Modal Body / Form */}
                            <form onSubmit={handleSubmit}>
                                <div className="p-6 space-y-4">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre del Recurso *</label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            placeholder="Ej. Ing. Juan Pérez o Sala de Consultas A"
                                            className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors"
                                            required
                                        />
                                        {errors.name && <div className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.name}</div>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Type */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Recurso *</label>
                                            <select
                                                value={data.type}
                                                onChange={e => setData('type', e.target.value)}
                                                className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors"
                                            >
                                                <option value="person">Persona (Asesor)</option>
                                                <option value="room">Sala de Reunión / Lugar</option>
                                                <option value="equipment">Equipo</option>
                                                <option value="vehicle">Vehículo</option>
                                            </select>
                                        </div>

                                        {/* Capacity */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1" title="Citas concurrentes permitidas en el mismo horario">Capacidad *</label>
                                            <input
                                                type="number"
                                                value={data.capacity}
                                                onChange={e => setData('capacity', e.target.value)}
                                                min="1"
                                                className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors"
                                                required
                                            />
                                            {errors.capacity && <div className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.capacity}</div>}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descripción</label>
                                        <textarea
                                            value={data.description}
                                            onChange={e => setData('description', e.target.value)}
                                            placeholder="Detalla la especialidad del asesor o las características del espacio..."
                                            rows="2.5"
                                            className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors resize-none"
                                        />
                                        {errors.description && <div className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.description}</div>}
                                    </div>

                                    {/* DYNAMIC METADATA INPUTS */}
                                    {data.type === 'person' && (
                                        <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl animate-fade-in-down">
                                            <h4 className="text-xs font-extrabold text-slate-700 mb-2 flex items-center gap-1.5">
                                                <Phone className="h-4 w-4 text-brand-teal" />
                                                Información de Contacto del Asesor
                                            </h4>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Número de WhatsApp</label>
                                                <input
                                                    type="text"
                                                    value={data.whatsapp}
                                                    onChange={e => setData('whatsapp', e.target.value)}
                                                    placeholder="ej: +573111111111"
                                                    className="block w-full px-3 py-2 border border-slate-250 rounded-xl bg-white text-sm focus:outline-none focus:border-brand-teal transition-colors"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {data.type === 'room' && (
                                        <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-3 animate-fade-in-down">
                                            <h4 className="text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                                <Video className="h-4 w-4 text-blue-500" />
                                                Configuración de la Sala
                                            </h4>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">URL de Reunión Virtual (Zoom, Meet, Teams)</label>
                                                <input
                                                    type="url"
                                                    value={data.meeting_url}
                                                    onChange={e => setData('meeting_url', e.target.value)}
                                                    placeholder="https://meet.google.com/abc-defg-hij"
                                                    className="block w-full px-3 py-2 border border-slate-250 rounded-xl bg-white text-sm focus:outline-none focus:border-brand-teal transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ubicación Física (Opcional)</label>
                                                <input
                                                    type="text"
                                                    value={data.location}
                                                    onChange={e => setData('location', e.target.value)}
                                                    placeholder="ej: Oficina 402, Calle Principal"
                                                    className="block w-full px-3 py-2 border border-slate-250 rounded-xl bg-white text-sm focus:outline-none focus:border-brand-teal transition-colors"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Active Checkbox */}
                                    <div className="flex items-center gap-2 pt-2">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            checked={data.is_active}
                                            onChange={e => setData('is_active', e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-brand-teal focus:ring-brand-teal"
                                        />
                                        <label htmlFor="is_active" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                                            Recurso activo (Disponible para agendamiento)
                                        </label>
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
                                        {editingResource ? 'Guardar Cambios' : 'Registrar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
