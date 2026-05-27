import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { 
    Calendar as CalendarIcon, 
    Clock, 
    User, 
    Briefcase, 
    CheckCircle, 
    XCircle, 
    AlertCircle, 
    Filter,
    Plus,
    Search,
    MessageSquare,
    Globe,
    Cpu,
    List
} from 'lucide-react';

export default function BookingsIndex({ bookings, resources, products }) {
    const [selectedResource, setSelectedResource] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all'); // all, pending, confirmed, cancelled
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('calendar'); // calendar, list
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['bookings'], preserveState: true });
        }, 20000);

        return () => clearInterval(interval);
    }, []);

    const statusColors = {
        pending: 'bg-amber-50 text-amber-700 border-amber-250',
        confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-250',
        cancelled: 'bg-red-50 text-red-700 border-red-200'
    };

    const statusNames = {
        pending: 'Pendiente',
        confirmed: 'Confirmada',
        cancelled: 'Cancelada'
    };

    // Filter logic
    const filteredBookings = bookings.filter(booking => {
        // Resource Filter
        if (selectedResource !== 'all' && booking.resource_id !== parseInt(selectedResource)) return false;

        // Status Filter
        if (statusFilter === 'all') {
            if (booking.status === 'cancelled') return false;
        } else if (booking.status !== statusFilter) {
            return false;
        }

        // Search Filter
        if (search) {
            const query = search.toLowerCase();
            const titleMatch = booking.title?.toLowerCase().includes(query);
            const contactMatch = booking.contact?.name?.toLowerCase().includes(query);
            const resourceMatch = booking.resource?.name?.toLowerCase().includes(query);
            const productMatch = booking.product?.name?.toLowerCase().includes(query);
            return titleMatch || contactMatch || resourceMatch || productMatch;
        }

        return true;
    });

    // Map bookings to FullCalendar events
    const calendarEvents = filteredBookings.map(booking => {
        let color = '#f59e0b'; // amber for pending
        if (booking.status === 'confirmed') color = '#10b981'; // emerald
        if (booking.status === 'cancelled') color = '#ef4444'; // red

        return {
            id: String(booking.id),
            title: `${booking.title} (${booking.contact?.name || 'Cliente'})`,
            start: booking.starts_at,
            end: booking.ends_at,
            backgroundColor: color,
            borderColor: 'transparent',
            textColor: '#ffffff',
            extendedProps: {
                booking
            }
        };
    });

    // Stats
    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        resourcesCount: resources.length
    };

    const handleEventClick = (info) => {
        setSelectedEvent(info.event.extendedProps.booking);
    };

    const handleEventChange = (changeInfo) => {
        const { event } = changeInfo;
        const bookingId = event.id;
        const startsAt = event.startStr;
        let endsAt = event.endStr;
        if (!endsAt && event.start) {
            const endDate = new Date(event.start.getTime() + 60 * 60 * 1000);
            endsAt = endDate.toISOString();
        }

        router.patch(route('bookings.update', bookingId), {
            starts_at: startsAt,
            ends_at: endsAt
        }, {
            preserveScroll: true,
            onError: (errors) => {
                changeInfo.revert();
                alert('No se pudo reprogramar la cita: ' + Object.values(errors).join(', '));
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            Agenda de Reservas
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Controla las citas asignadas a asesores y recursos físicos o virtuales.</p>
                    </div>
                    {/* View Switcher */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                        <button 
                            onClick={() => setViewMode('calendar')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <CalendarIcon className="h-3.5 w-3.5" />
                            Calendario
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <List className="h-3.5 w-3.5" />
                            Lista
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Agenda" />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Reservas</span>
                        <div className="text-2xl font-extrabold text-slate-800 mt-1 font-mono">{stats.total}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 shadow-inner">
                        <CalendarIcon className="h-5 w-5" />
                    </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Confirmadas</span>
                        <div className="text-2xl font-extrabold text-emerald-650 mt-1 font-mono">{stats.confirmed}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                        <CheckCircle className="h-5 w-5" />
                    </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pendientes</span>
                        <div className="text-2xl font-extrabold text-amber-650 mt-1 font-mono">{stats.pending}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
                        <Clock className="h-5 w-5" />
                    </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recursos Activos</span>
                        <div className="text-2xl font-extrabold text-brand-teal mt-1 font-mono">{stats.resourcesCount}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-brand-teal-light border border-brand-teal/10 text-brand-teal">
                        <Cpu className="h-5 w-5" />
                    </div>
                </div>
            </div>

            {/* Filtering toolbar */}
            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-sm">
                {/* Search */}
                <div className="relative w-full lg:w-72">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4.5 w-4.5 text-slate-400" />
                    </span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar cita, cliente, asesor..."
                        className="block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-colors"
                    />
                </div>

                {/* Filters Group */}
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    {/* Resource Filter */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs text-slate-450 font-bold whitespace-nowrap">Recurso:</span>
                        <select
                            value={selectedResource}
                            onChange={(e) => setSelectedResource(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl focus:bg-white focus:ring-brand-teal focus:border-brand-teal block w-full p-2"
                        >
                            <option value="all">Todos los recursos</option>
                            {resources.map((res) => (
                                <option key={res.id} value={res.id}>{res.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs text-slate-450 font-bold whitespace-nowrap">Estado:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl focus:bg-white focus:ring-brand-teal focus:border-brand-teal block w-full p-2"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="pending">Pendientes</option>
                            <option value="confirmed">Confirmados</option>
                            <option value="cancelled">Cancelados</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Area */}
            {viewMode === 'calendar' ? (
                <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm relative">
                    <div className="calendar-container fc-theme-light">
                        <style>{`
                            .fc {
                                font-family: inherit;
                                --fc-border-color: #f1f5f9;
                                --fc-page-bg-color: #ffffff;
                                --fc-button-bg-color: #f8fafc;
                                --fc-button-border-color: #e2e8f0;
                                --fc-button-text-color: #334155;
                                --fc-button-active-bg-color: #e2e8f0;
                                --fc-button-active-border-color: #cbd5e1;
                                --fc-button-hover-bg-color: #f1f5f9;
                            }
                            .fc .fc-toolbar-title {
                                font-size: 1.1rem;
                                font-weight: 700;
                                color: #1e293b;
                                text-transform: capitalize;
                            }
                            .fc .fc-button {
                                padding: 6px 12px;
                                font-size: 0.75rem;
                                font-weight: 700;
                                border-radius: 10px;
                                text-transform: capitalize;
                                transition: all 0.2s;
                            }
                            .fc .fc-button-primary:not(:disabled).fc-button-active, 
                            .fc .fc-button-primary:not(:disabled):active {
                                background-color: #0d9488 !important;
                                border-color: #0d9488 !important;
                                color: #ffffff !important;
                            }
                            .fc-theme-light th {
                                padding: 8px 0;
                                font-size: 0.75rem;
                                font-weight: 700;
                                color: #64748b;
                                background-color: #f8fafc;
                                border-bottom: 1px solid #e2e8f0;
                            }
                            .fc-event {
                                border-radius: 6px;
                                padding: 2px 4px;
                                font-size: 0.75rem;
                                font-weight: 600;
                                cursor: pointer;
                                transition: transform 0.1s;
                            }
                            .fc-event:hover {
                                transform: scale(1.02);
                            }
                        `}</style>
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                            }}
                            events={calendarEvents}
                            eventClick={handleEventClick}
                            editable={true}
                            eventStartEditable={true}
                            eventDurationEditable={true}
                            eventDrop={handleEventChange}
                            eventResize={handleEventChange}
                            locale="es"
                            buttonText={{
                                today: 'Hoy',
                                month: 'Mes',
                                week: 'Semana',
                                day: 'Día',
                                list: 'Lista'
                            }}
                            height="auto"
                        />
                    </div>

                    {/* Quick detail modal */}
                    {selectedEvent && (
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 relative">
                                <button 
                                    onClick={() => setSelectedEvent(null)}
                                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg"
                                >
                                    &times;
                                </button>
                                <h3 className="text-lg font-bold text-slate-800 mb-4 pr-6">
                                    Detalles de la Cita
                                </h3>

                                <div className="space-y-4 text-sm">
                                    <div>
                                        <div className="text-xs text-slate-400 font-bold uppercase">Título</div>
                                        <div className="font-semibold text-slate-800 mt-0.5">{selectedEvent.title}</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs text-slate-400 font-bold uppercase">Fecha y Hora</div>
                                            <div className="font-semibold text-slate-800 mt-0.5 font-mono">
                                                {new Date(selectedEvent.starts_at).toLocaleDateString('es-ES')} <br/>
                                                {new Date(selectedEvent.starts_at).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-400 font-bold uppercase">Estado</div>
                                            <div className="mt-1">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusColors[selectedEvent.status]}`}>
                                                    {statusNames[selectedEvent.status]}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-100 pt-3">
                                        <div className="text-xs text-slate-400 font-bold uppercase">Cliente / Contacto</div>
                                        <div className="font-semibold text-slate-800 mt-0.5">{selectedEvent.contact?.name || 'Cliente'}</div>
                                        <div className="text-xs text-slate-500 font-mono mt-0.5">{selectedEvent.contact?.whatsapp_phone}</div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-slate-400 font-bold uppercase">Asesor / Recurso</div>
                                        <div className="font-semibold text-slate-800 mt-0.5">{selectedEvent.resource?.name}</div>
                                    </div>

                                    {selectedEvent.notes && (
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-xs text-slate-650">
                                            <strong>Notas: </strong> {selectedEvent.notes}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button 
                                        onClick={() => setSelectedEvent(null)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Original Agenda List View */
                <div className="grid grid-cols-1 gap-4">
                    {filteredBookings.length === 0 ? (
                        <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl py-16 text-center text-slate-400">
                            <CalendarIcon className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                            <h3 className="font-bold text-slate-700">No se encontraron reservas</h3>
                            <p className="text-xs text-slate-500 mt-1">Intenta ajustando los filtros de búsqueda o recursos.</p>
                        </div>
                    ) : (
                        filteredBookings.map((booking) => {
                            const startDate = new Date(booking.starts_at);
                            const endDate = new Date(booking.ends_at);
                            const isPending = booking.status === 'pending';

                            return (
                                <div 
                                    key={booking.id} 
                                    className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all duration-300 shadow-sm"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        {/* Time & Title Info */}
                                        <div className="flex items-start gap-4">
                                            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col items-center justify-center min-w-[70px] shadow-sm">
                                                <span className="text-[10px] uppercase font-extrabold text-brand-teal font-mono">
                                                    {startDate.toLocaleDateString('es-ES', { month: 'short' })}
                                                </span>
                                                <span className="text-2xl font-extrabold text-slate-800 font-mono leading-none my-1">
                                                    {startDate.getDate()}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-bold">
                                                    {startDate.toLocaleDateString('es-ES', { weekday: 'short' })}
                                                </span>
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-base text-slate-800">{booking.title}</h3>
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${statusColors[booking.status] || statusColors.pending}`}>
                                                        {statusNames[booking.status] || booking.status}
                                                    </span>
                                                </div>
                                                
                                                {/* Resource Assigned details */}
                                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap font-semibold">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                        <span className="font-mono">
                                                            {startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })} - {endDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                        </span>
                                                    </span>
                                                    <span className="h-1.5 w-1.5 rounded-full bg-slate-200"></span>
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3.5 w-3.5 text-slate-400" />
                                                        <span>Recurso: <strong className="text-slate-700 font-bold">{booking.resource?.name}</strong></span>
                                                    </span>
                                                    {booking.product && (
                                                        <>
                                                            <span className="h-1.5 w-1.5 rounded-full bg-slate-200"></span>
                                                            <span className="flex items-center gap-1">
                                                                <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                                                                <span>Servicio: <strong className="text-slate-700 font-bold">{booking.product.name} (${parseFloat(booking.product.price).toFixed(0)})</strong></span>
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Client details & Source info */}
                                        <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                                            <div className="text-left md:text-right">
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lead / Contacto</div>
                                                <div className="font-bold text-sm text-slate-800 mt-0.5">{booking.contact?.name || 'Cliente'}</div>
                                                <div className="text-[10px] text-slate-500 font-mono font-semibold mt-0.5">{booking.contact?.whatsapp_phone}</div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {/* Booking source */}
                                                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 shadow-inner" title={`Origen: ${booking.source}`}>
                                                    {booking.source === 'whatsapp' ? (
                                                        <MessageSquare className="h-4 w-4 text-emerald-600" />
                                                    ) : (
                                                        <Globe className="h-4 w-4 text-brand-teal" />
                                                    )}
                                                </div>

                                                {/* Action simulations */}
                                                {isPending && (
                                                    <button className="text-xs bg-brand-teal hover:bg-brand-teal/90 text-white font-bold px-3 py-2 rounded-xl shadow-sm transition-all">
                                                        Confirmar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {booking.notes && (
                                        <div className="mt-3.5 bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-xs text-slate-500">
                                            <span className="font-bold text-slate-700">Notas: </span>{booking.notes}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
