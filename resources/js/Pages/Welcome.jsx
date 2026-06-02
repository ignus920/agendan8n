import { Head, Link } from '@inertiajs/react';
import { 
    Sparkles, 
    ArrowRight, 
    Zap, 
    Award, 
    MessageSquare, 
    Calendar, 
    Shield, 
    Settings2 
} from 'lucide-react';

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="SAC - Sistema Autónomo Comercial" />
            <div className="bg-slate-50 min-h-screen text-slate-800 flex flex-col font-sans">
                {/* Header/Nav */}
                <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-brand-teal text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-brand-teal/20">
                                S
                            </div>
                            <div>
                                <span className="font-bold text-slate-900 tracking-tight text-lg">SAC</span>
                                <span className="text-xs text-brand-teal block font-semibold -mt-1">Sistema Autónomo Comercial</span>
                            </div>
                        </div>
                        <nav>
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-slate-900/10"
                                >
                                    <span>Ir al Panel</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="flex items-center gap-2 bg-brand-teal hover:bg-brand-teal/90 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-brand-teal/15"
                                >
                                    <span>Ingresar</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            )}
                        </nav>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="flex-1">
                    <section className="relative py-20 lg:py-28 overflow-hidden bg-white">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-teal/5 rounded-full blur-3xl -mr-48 -mt-24 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-3xl -ml-48 -mb-24 pointer-events-none"></div>

                        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center space-y-6">
                            <div className="inline-flex items-center gap-2 bg-brand-teal-light text-brand-teal border border-brand-teal/20 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                                <Sparkles className="h-4 w-4" />
                                Automatización Comercial del Futuro
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.1]">
                                Convierte tus Chats de WhatsApp en Ventas con un <span className="text-brand-teal">Cerebro Autónomo</span>
                            </h1>
                            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                                La plataforma que califica a tus leads, les asigna puntajes según su comportamiento y agenda citas de forma 100% autónoma a través de WhatsMark.
                            </p>
                            <div className="pt-4 flex justify-center gap-4">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg shadow-slate-900/10 flex items-center gap-2 text-base"
                                    >
                                        <span>Administrar Sistema</span>
                                        <ArrowRight className="h-5 w-5" />
                                    </Link>
                                ) : (
                                    <Link
                                        href={route('login')}
                                        className="bg-brand-teal hover:bg-brand-teal/90 text-white px-8 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg shadow-brand-teal/25 flex items-center gap-2 text-base"
                                    >
                                        <span>Comenzar Ahora</span>
                                        <ArrowRight className="h-5 w-5" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Features Grid */}
                    <section className="py-20 bg-slate-50 border-t border-slate-200/80">
                        <div className="max-w-7xl mx-auto px-6 space-y-12">
                            <div className="text-center space-y-3">
                                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                                    ¿Qué puede hacer el Sistema Autónomo Comercial (SAC)?
                                </h2>
                                <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                                    Diseñado para operar sin intervención humana constante, asegurando que ningún cliente quede sin atención y cerrando citas de negocio al instante.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
                                    <div className="h-12 w-12 bg-brand-teal-light text-brand-teal rounded-xl flex items-center justify-center border border-brand-teal/20">
                                        <Zap className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-base">Captura & Registro Autónomo</h3>
                                    <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                                        Cualquier prospecto que escriba a WhatsMark se registra automáticamente en tu base de datos y en tu embudo, sin necesidad de carga manual.
                                    </p>
                                </div>

                                <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
                                    <div className="h-12 w-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center border border-blue-500/20">
                                        <Award className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-base">Calificación Inteligente (Scoring)</h3>
                                    <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                                        El sistema evalúa las intenciones y respuestas de cada lead. Otorga puntos y detecta cuándo está lo suficientemente caliente para comprar o agendar.
                                    </p>
                                </div>

                                <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
                                    <div className="h-12 w-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center border border-purple-500/20">
                                        <Settings2 className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-base">Constructor de Flujos Gráficos</h3>
                                    <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                                        Dibuja visualmente la lógica de tus bots. Arrastra nodos para definir palabras clave, otorgar puntajes y enlazar flujos conversacionales.
                                    </p>
                                </div>

                                <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
                                    <div className="h-12 w-12 bg-brand-orange-light text-brand-orange rounded-xl flex items-center justify-center border border-brand-orange/20">
                                        <Calendar className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-base">Agendamiento de Citas Nátivo</h3>
                                    <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                                        El robot calcula los horarios libres de tus asesores en la zona horaria correcta, envía un menú interactivo y agenda la cita de forma 100% autónoma.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* How it Works / WhatsMark Section */}
                    <section className="py-20 bg-white border-t border-slate-200/80">
                        <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
                            <div className="h-12 w-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500/20 mx-auto">
                                <MessageSquare className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                Potenciado por la Pasarela WhatsMark
                            </h2>
                            <p className="text-base text-slate-500 leading-relaxed max-w-3xl mx-auto">
                                Integración nativa con tu línea de WhatsMark para enviar y recibir mensajes dinámicos, disparar plantillas oficiales personalizadas para tus clientes y sincronizar información de contacto como estados del embudo y etiquetas en tiempo real.
                            </p>
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer className="border-t border-slate-200/80 bg-white py-8 text-center text-xs text-slate-400">
                    &copy; {new Date().getFullYear()} SAC - Sistema Autónomo Comercial. Todos los derechos reservados.
                </footer>
            </div>
        </>
    );
}
