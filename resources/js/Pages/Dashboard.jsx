import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    Users, 
    Flame, 
    Calendar, 
    Zap, 
    TrendingUp, 
    Activity,
    Target,
    ArrowRight,
    MessageSquare,
    CheckCircle,
    Clock,
    Award
} from 'lucide-react';

export default function Dashboard({ stats, funnelData, recentBookings }) {
    // Total contacts in the funnel
    const totalFunnel = Object.values(funnelData).reduce((a, b) => a + b, 0);

    // Human-readable names for funnel stages
    const stageNames = {
        new: 'Nuevos',
        interested: 'Interesados',
        qualified: 'Calificados',
        negotiation: 'Negociación',
        customer: 'Clientes',
        lost: 'Perdidos'
    };

    // Color maps for funnel stages
    const stageColors = {
        new: 'bg-brand-teal shadow-[0_0_8px_rgba(70,164,189,0.15)]',
        interested: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.15)]',
        qualified: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.15)]',
        negotiation: 'bg-brand-orange shadow-[0_0_8px_rgba(229,101,54,0.15)]',
        customer: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.15)]',
        lost: 'bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.15)]'
    };

    const stageTextColors = {
        new: 'text-brand-teal',
        interested: 'text-blue-600',
        qualified: 'text-amber-600',
        negotiation: 'text-brand-orange',
        customer: 'text-emerald-600',
        lost: 'text-slate-500'
    };

    const stageBgColors = {
        new: 'bg-brand-teal-light/40 border-brand-teal/10',
        interested: 'bg-blue-50/40 border-blue-100',
        qualified: 'bg-amber-50/40 border-amber-100',
        negotiation: 'bg-brand-orange-light/40 border-brand-orange/10',
        customer: 'bg-emerald-50/40 border-emerald-100',
        lost: 'bg-slate-50 border-slate-200/60'
    };

    // Find the max count for funnel visualization scaling
    const maxFunnelCount = Math.max(...Object.values(funnelData), 1);

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-bold text-slate-800">
                        Panel de Control
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Monitoreo de leads, agendas y automatización en tiempo real.</p>
                </div>
            }
        >
            <Head title="Dashboard" />

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {/* Metric 1 */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-brand-teal/30 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Leads Totales</span>
                        <div className="p-2.5 rounded-xl bg-brand-teal-light border border-brand-teal/10 text-brand-teal">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-extrabold text-slate-800 font-mono">{stats.total_contacts}</div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-brand-teal bg-brand-teal-light/80 border border-brand-teal/15 px-2 py-0.5 rounded-md w-fit font-semibold">
                            <Activity className="h-3 w-3" />
                            <span>En canal de ventas</span>
                        </div>
                    </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-brand-orange/30 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Leads Calientes (Hot)</span>
                        <div className="p-2.5 rounded-xl bg-brand-orange-light border border-brand-orange/10 text-brand-orange">
                            <Flame className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-extrabold text-slate-800 font-mono">{stats.hot_contacts}</div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-brand-orange bg-brand-orange-light/80 border border-brand-orange/15 px-2 py-0.5 rounded-md w-fit font-semibold">
                            <TrendingUp className="h-3 w-3" />
                            <span>Prioridad de contacto</span>
                        </div>
                    </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-emerald-500/30 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Citas Hoy / Activas</span>
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-650">
                            <Calendar className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-extrabold text-slate-800 font-mono">
                            {stats.today_bookings_count} <span className="text-lg text-slate-450 font-normal">/ {stats.active_bookings_count}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100/60 px-2 py-0.5 rounded-md w-fit font-semibold">
                            <Clock className="h-3 w-3" />
                            <span>Agendamientos por bot</span>
                        </div>
                    </div>
                </div>

                {/* Metric 4 */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-blue-500/30 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Score Promedio</span>
                        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                            <Award className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-extrabold text-slate-800 font-mono">{stats.average_lead_score} pts</div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-blue-700 bg-blue-50 border border-blue-100/60 px-2 py-0.5 rounded-md w-fit font-semibold">
                            <Zap className="h-3 w-3" />
                            <span>{stats.active_automations_count} Reglas Activas</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sales Funnel Section */}
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-lg text-slate-850 flex items-center gap-2">
                                <Target className="h-5 w-5 text-brand-teal" />
                                Embudo de Ventas Conversacional
                            </h3>
                            <p className="text-xs text-slate-500">Distribución de contactos según su etapa en el proceso.</p>
                        </div>
                        <span className="text-xs font-semibold text-slate-400 font-mono">
                            Total: {totalFunnel} leads
                        </span>
                    </div>

                    <div className="space-y-4">
                        {Object.entries(funnelData).map(([stage, count]) => {
                            const percent = totalFunnel > 0 ? Math.round((count / totalFunnel) * 100) : 0;
                            const visualWidth = Math.max(10, Math.round((count / maxFunnelCount) * 100));
                            return (
                                <div key={stage} className={`p-4 rounded-xl border ${stageBgColors[stage]} transition-all hover:scale-[1.01] duration-300`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2.5 h-2.5 rounded-full ${(stageColors[stage] || 'bg-slate-450').split(' ')[0]}`}></span>
                                            <span className="font-bold text-sm text-slate-700 capitalize">{stageNames[stage]}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-extrabold text-slate-800 font-mono">{count}</span>
                                            <span className="text-xs text-slate-400 ml-1.5 font-mono">({percent}%)</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/65">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${stageColors[stage]}`}
                                            style={{ width: `${visualWidth}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bookings / Agenda Section */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-lg text-slate-850 flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-emerald-600" />
                                Próximas Citas
                            </h3>
                            <p className="text-xs text-slate-500">Últimos agendamientos programados.</p>
                        </div>
                        <Link 
                            href={route('bookings.index')} 
                            className="text-xs text-brand-teal hover:text-brand-teal/80 hover:underline flex items-center gap-0.5 font-semibold"
                        >
                            Ver Todo <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>

                    {recentBookings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <Calendar className="h-8 w-8 text-slate-300 mb-2" />
                            <span className="text-xs">No hay citas registradas</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentBookings.map((booking) => {
                                const bookingDate = new Date(booking.starts_at);
                                const isPending = booking.status === 'pending';
                                
                                return (
                                    <div key={booking.id} className="p-3.5 rounded-xl border border-slate-150 bg-slate-50/20 hover:border-slate-200 hover:bg-slate-50/50 transition-all">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                                                    {booking.title}
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">
                                                    Lead: <span className="text-slate-600 font-semibold">{booking.contact?.name || 'Cliente'}</span>
                                                </div>
                                            </div>
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold border ${
                                                isPending
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            }`}>
                                                {isPending ? 'Pendiente' : 'Confirmado'}
                                            </span>
                                        </div>

                                        <div className="h-px bg-slate-150 my-2.5"></div>

                                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="font-semibold">
                                                    {bookingDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                    {' - '}
                                                    {bookingDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                </span>
                                            </div>
                                            <div className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-600 font-bold truncate max-w-[120px]" title={booking.resource?.name}>
                                                {booking.resource?.name ? booking.resource.name.split(' ')[0] : 'Asesor'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
