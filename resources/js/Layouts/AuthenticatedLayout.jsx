import { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
    LayoutDashboard, 
    Users, 
    Calendar, 
    Settings, 
    LogOut, 
    User, 
    Bot, 
    Sparkles, 
    MessageSquare,
    Menu,
    X,
    ChevronRight,
    Activity,
    Package,
    Megaphone,
    Briefcase,
    ShieldAlert
} from 'lucide-react';

export default function AuthenticatedLayout({ header, children }) {
    const { auth, currentTenant, flash } = usePage().props;
    const user = auth.user;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [flashMsg, setFlashMsg] = useState(null);

    useEffect(() => {
        if (flash?.success || flash?.error) {
            setFlashMsg(flash);
            const timer = setTimeout(() => setFlashMsg(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash]);


    // Navigation depends on role
    // Super admin: only Ticsia platform management items
    // Tenant user (or super_admin impersonating): full business menu
    const isSuperAdminMode = user.role === 'super_admin' && !auth.impersonated_tenant_id;

    const superAdminNavigation = [
        { 
            name: 'Panel de Comercios', 
            href: route('ticsia.tenants.index'), 
            icon: ShieldAlert, 
            current: route().current('ticsia.tenants.index')
        },
    ];

    const tenantNavigation = [
        { name: 'Dashboard', href: route('dashboard'), icon: LayoutDashboard, current: route().current('dashboard') },
        { name: 'Contactos', href: route('contacts.index'), icon: Users, current: route().current('contacts.index') },
        { name: 'Agenda (Citas)', href: route('bookings.index'), icon: Calendar, current: route().current('bookings.index') },
        { name: 'Productos', href: route('products.index'), icon: Package, current: route().current('products.index') },
        { name: 'Recursos', href: route('resources.index'), icon: Briefcase, current: route().current('resources.index') },
        { name: 'Campañas', href: route('campaigns.index'), icon: Megaphone, current: route().current('campaigns.index') },
        { name: 'Automatizaciones', href: route('settings.automations'), icon: Settings, current: route().current('settings.automations') },
    ];

    const navigation = isSuperAdminMode ? superAdminNavigation : tenantNavigation;


    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col md:flex-row antialiased">
            <aside className={`hidden md:flex flex-col w-64 shrink-0 border-r ${
                isSuperAdminMode 
                    ? 'bg-slate-950 border-slate-800' 
                    : 'bg-white border-slate-200/80 shadow-[1px_0_5px_rgba(0,0,0,0.015)]'
            }`}>
                {/* Brand / Logo */}
                <div className={`h-16 flex items-center gap-3 px-6 border-b ${
                    isSuperAdminMode ? 'border-slate-800' : 'border-slate-100'
                }`}>
                    <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center overflow-hidden">
                        <img src="/logoti.jpg" alt="Logo" className="h-8 w-8 object-contain" />
                    </div>
                    <div>
                        <span className={`font-bold text-lg ${ isSuperAdminMode ? 'text-white' : 'text-slate-800' }`}>
                            {isSuperAdminMode ? 'Ticsia' : 'SAC '}
                            <span className="text-brand-teal">{isSuperAdminMode ? ' Admin' : 'Autónomo'}</span>
                        </span>
                        <div className={`text-[9px] font-mono tracking-widest uppercase font-semibold ${
                            isSuperAdminMode ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                            {isSuperAdminMode ? 'Plataforma SaaS' : 'Engine V1.0'}
                        </div>
                    </div>
                </div>

                {/* Super Admin Info Banner (when in super admin mode) */}
                {isSuperAdminMode && (
                    <div className="mx-4 mt-4 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
                            <div>
                                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Modo Administrador</div>
                                <div className="text-[9px] text-slate-400 mt-0.5">Gestión de la plataforma</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Impersonation indicator in nav */}
                {!isSuperAdminMode && user.role === 'super_admin' && (
                    <div className="mx-4 mt-4 px-3 py-2 rounded-xl bg-brand-teal/10 border border-brand-teal/20">
                        <div className="text-[9px] font-bold text-brand-teal uppercase tracking-wider">Viendo como:</div>
                        <div className="text-xs font-bold text-white mt-0.5 truncate">{currentTenant?.name}</div>
                    </div>
                )}

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                                    isSuperAdminMode
                                        ? item.current
                                            ? 'bg-brand-teal/15 text-brand-teal border border-brand-teal/20 shadow-sm'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                                        : item.current
                                            ? 'bg-brand-teal-light text-brand-teal border border-brand-teal/10 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
                                }`}
                            >
                                <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${
                                    item.current ? 'text-brand-teal' : isSuperAdminMode ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-600'
                                }`} />
                                <span>{item.name}</span>
                                {item.current && (
                                    <ChevronRight className="ml-auto h-4 w-4 text-brand-teal" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section / Footer */}
                <div className={`p-4 border-t ${ isSuperAdminMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/50' }`}>
                    <div className="flex items-center gap-3 px-2 py-2 mb-2">
                        <div className={`h-9 w-9 rounded-full border flex items-center justify-center font-bold uppercase ${
                            isSuperAdminMode 
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                                : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}>
                            {user.name.charAt(0)}
                        </div>
                        <div className="truncate">
                            <div className={`text-xs font-semibold truncate ${ isSuperAdminMode ? 'text-white' : 'text-slate-700' }`}>{user.name}</div>
                            <div className={`text-[10px] truncate font-bold ${ isSuperAdminMode ? 'text-amber-400' : 'text-slate-400 capitalize' }`}>
                                {isSuperAdminMode ? '⭐ Super Administrador' : user.role.replace('_', ' ')}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <Link
                            href={route('profile.edit')}
                            className={`flex-1 flex justify-center items-center py-2 px-3 rounded-lg text-xs border transition-all ${
                                isSuperAdminMode 
                                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400 hover:text-white' 
                                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-800'
                            }`}
                            title="Ver Perfil"
                        >
                            <User className="h-3.5 w-3.5 mr-1" />
                            Perfil
                        </Link>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="flex justify-center items-center p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all"
                            title="Cerrar Sesión"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className={`md:hidden flex h-16 items-center justify-between px-6 border-b z-50 shrink-0 ${
                isSuperAdminMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200/80'
            }`}>
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                        <img src="/logoti.jpg" alt="Logo" className="h-7 w-7 object-contain" />
                    </div>
                    <span className={`font-bold text-base ${ isSuperAdminMode ? 'text-white' : 'text-slate-850' }`}>
                        {isSuperAdminMode ? 'Ticsia' : 'SAC '}
                        <span className="text-brand-teal">{isSuperAdminMode ? ' Admin' : 'Autónomo'}</span>
                    </span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className={`p-2 rounded-lg border transition-all ${
                        isSuperAdminMode 
                            ? 'bg-slate-800 text-slate-400 hover:text-white border-slate-700' 
                            : 'bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-slate-205'
                    }`}
                >
                    {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </header>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 flex">
                    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
                    <aside className={`relative flex flex-col w-72 max-w-xs h-full p-4 z-50 animate-slide-in border-r ${
                        isSuperAdminMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                        <div className={`h-16 flex items-center gap-3 px-2 border-b mb-4 ${ isSuperAdminMode ? 'border-slate-800' : 'border-slate-100' }`}>
                            <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                                <img src="/logoti.jpg" alt="Logo" className="h-7 w-7 object-contain" />
                            </div>
                            <span className={`font-bold text-base ${ isSuperAdminMode ? 'text-white' : 'text-slate-850' }`}>
                                {isSuperAdminMode ? 'Ticsia' : 'SAC '}
                                <span className="text-brand-teal">{isSuperAdminMode ? ' Admin' : 'Autónomo'}</span>
                            </span>
                        </div>

                        {isSuperAdminMode && (
                            <div className="mb-3 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">⭐ Modo Administrador</div>
                            </div>
                        )}

                        <nav className="flex-1 space-y-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                            isSuperAdminMode
                                                ? item.current
                                                    ? 'bg-brand-teal/15 text-brand-teal border border-brand-teal/20'
                                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                                : item.current
                                                    ? 'bg-brand-teal-light text-brand-teal border border-brand-teal/10'
                                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                        }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className={`pt-4 border-t mt-auto ${ isSuperAdminMode ? 'border-slate-800' : 'border-slate-100' }`}>
                            <div className="flex items-center gap-3 px-2 py-2 mb-2">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold uppercase ${
                                    isSuperAdminMode ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-slate-100 text-slate-650'
                                }`}>
                                    {user.name.charAt(0)}
                                </div>
                                <div className="truncate">
                                    <div className={`text-xs font-semibold truncate ${ isSuperAdminMode ? 'text-white' : 'text-slate-700' }`}>{user.name}</div>
                                    <div className={`text-[10px] truncate font-bold ${ isSuperAdminMode ? 'text-amber-400' : 'text-slate-400 capitalize' }`}>
                                        {isSuperAdminMode ? '⭐ Super Admin' : user.role.replace('_', ' ')}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    href={route('profile.edit')}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex-1 flex justify-center items-center py-2 px-3 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-850 hover:bg-slate-100"
                                >
                                    <User className="h-3.5 w-3.5 mr-1" />
                                    Perfil
                                </Link>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="flex justify-center items-center p-2 rounded-lg bg-red-50 border border-red-200 text-red-500 hover:bg-red-100"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {auth.impersonated_tenant_id && (
                    <div className="bg-amber-500 text-slate-950 font-semibold px-6 py-2 flex items-center justify-between shadow-sm shrink-0 z-50">
                        <div className="flex items-center gap-2 text-xs md:text-sm">
                            <span>⚠️ Estás suplantando a la cuenta: <strong>{auth.impersonated_tenant_name}</strong></span>
                        </div>
                        <Link 
                            href={route('ticsia.stop-impersonating')} 
                            method="post" 
                            as="button" 
                            className="text-[10px] md:text-xs bg-slate-950 hover:bg-slate-905 text-white px-3 py-1 rounded-md transition-all font-semibold"
                        >
                            Salir de la Suplantación
                        </Link>
                    </div>
                )}
                {/* Topbar */}
                <header className="h-16 border-b border-slate-200/85 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-30">
                    <div className="flex items-center gap-2.5">
                        {isSuperAdminMode ? (
                            /* Super Admin topbar indicators */
                            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-full text-[11px] text-amber-700 font-semibold">
                                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                                <span>Ticsia Platform Admin</span>
                            </div>
                        ) : (
                            /* Tenant user indicators */
                            <>
                                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full text-[11px] text-emerald-700 font-semibold">
                                    <Activity className="h-3.5 w-3.5 animate-pulse text-emerald-500" />
                                    <span className="hidden sm:inline">WhatsApp Gateway:</span> Conectado
                                </div>
                                <div className="hidden sm:flex items-center gap-1.5 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full text-[11px] text-blue-700 font-semibold">
                                    <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                                    <span>AI: Gemini 2.0 Flash</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {!isSuperAdminMode && (
                            <span className="text-xs text-slate-500 font-mono hidden md:inline">
                                Tenant: <span className="text-brand-teal font-bold">{currentTenant?.name || '—'}</span>
                            </span>
                        )}
                        
                        <div className="h-4 w-px bg-slate-200 hidden md:block"></div>

                        {/* Topbar User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-2 focus:outline-none"
                            >
                                <span className="text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors hidden sm:inline">
                                    {user.name}
                                </span>
                                <div className="h-8 w-8 rounded-full bg-brand-teal text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            </button>

                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)}></div>
                                    <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-2xl p-1.5 z-40 animate-fade-in-down">
                                        <Link
                                            href={route('profile.edit')}
                                            onClick={() => setIsProfileOpen(false)}
                                            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-slate-650 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                                        >
                                            <User className="h-3.5 w-3.5 text-slate-400" />
                                            Mi Perfil
                                        </Link>
                                        <div className="h-px bg-slate-100 my-1"></div>
                                        <Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            onClick={() => setIsProfileOpen(false)}
                                            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors text-left font-semibold"
                                        >
                                            <LogOut className="h-3.5 w-3.5" />
                                            Cerrar Sesión
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Subheader / Page Title */}
                {header && (
                    <div className="bg-white px-6 py-4 border-b border-slate-200/80 shrink-0">
                        <div className="max-w-7xl mx-auto flex items-center justify-between">
                            {header}
                        </div>
                    </div>
                )}

                {/* Flash Notifications */}
                {flashMsg && (
                    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold transition-all animate-fade-in-down ${
                        flashMsg.success
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                        <span>{flashMsg.success ? '✅' : '❌'}</span>
                        <span>{flashMsg.success || flashMsg.error}</span>
                        <button onClick={() => setFlashMsg(null)} className="ml-2 text-slate-400 hover:text-slate-600 font-bold">✕</button>
                    </div>
                )}

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto px-6 py-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
