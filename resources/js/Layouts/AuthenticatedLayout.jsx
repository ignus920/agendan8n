import { useState } from 'react';
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
    Briefcase
} from 'lucide-react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: route('dashboard'), icon: LayoutDashboard, current: route().current('dashboard') },
        { name: 'Contactos', href: route('contacts.index'), icon: Users, current: route().current('contacts.index') },
        { name: 'Agenda (Citas)', href: route('bookings.index'), icon: Calendar, current: route().current('bookings.index') },
        { name: 'Productos', href: route('products.index'), icon: Package, current: route().current('products.index') },
        { name: 'Recursos', href: route('resources.index'), icon: Briefcase, current: route().current('resources.index') },
        { name: 'Campañas', href: route('campaigns.index'), icon: Megaphone, current: route().current('campaigns.index') },
        { name: 'Automatizaciones', href: route('settings.automations'), icon: Settings, current: route().current('settings.automations') },
    ];


    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col md:flex-row antialiased">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 shadow-[1px_0_5px_rgba(0,0,0,0.015)] shrink-0">
                {/* Brand / Logo */}
                <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
                    <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center overflow-hidden">
                        <img src="/logoti.jpg" alt="Logo" className="h-8 w-8 object-contain" />
                    </div>
                    <div>
                        <span className="font-bold text-lg text-slate-800">SAC <span className="text-brand-teal">Autónomo</span></span>
                        <div className="text-[9px] text-slate-400 font-mono tracking-widest uppercase font-semibold">Engine V1.0</div>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                                    item.current
                                        ? 'bg-brand-teal-light text-brand-teal border border-brand-teal/10 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
                                }`}
                            >
                                <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${
                                    item.current ? 'text-brand-teal' : 'text-slate-400 group-hover:text-slate-600'
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
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3 px-2 py-2 mb-2">
                        <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold uppercase">
                            {user.name.charAt(0)}
                        </div>
                        <div className="truncate">
                            <div className="text-xs font-semibold text-slate-700 truncate">{user.name}</div>
                            <div className="text-[10px] text-slate-400 truncate capitalize">{user.role.replace('_', ' ')}</div>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <Link
                            href={route('profile.edit')}
                            className="flex-1 flex justify-center items-center py-2 px-3 rounded-lg text-xs bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 transition-all"
                            title="Ver Perfil"
                        >
                            <User className="h-3.5 w-3.5 mr-1" />
                            Perfil
                        </Link>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="flex justify-center items-center p-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-150 text-red-500 transition-all"
                            title="Cerrar Sesión"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Mobile Header / Sidebar */}
            <header className="md:hidden flex h-16 items-center justify-between px-6 bg-white border-b border-slate-200/80 z-50 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                        <img src="/logoti.jpg" alt="Logo" className="h-7 w-7 object-contain" />
                    </div>
                    <span className="font-bold text-base text-slate-850">SAC <span className="text-brand-teal">Autónomo</span></span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-205 transition-all"
                >
                    {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </header>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 flex">
                    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
                    <aside className="relative flex flex-col w-72 max-w-xs bg-white border-r border-slate-200 h-full p-4 z-50 animate-slide-in">
                        <div className="h-16 flex items-center gap-3 px-2 border-b border-slate-100 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                                <img src="/logoti.jpg" alt="Logo" className="h-7 w-7 object-contain" />
                            </div>
                            <span className="font-bold text-base text-slate-850">SAC <span className="text-brand-teal">Autónomo</span></span>
                        </div>
                        <nav className="flex-1 space-y-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                            item.current
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
                        <div className="pt-4 border-t border-slate-100 mt-auto">
                            <div className="flex items-center gap-3 px-2 py-2 mb-2">
                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-650 font-bold uppercase">
                                    {user.name.charAt(0)}
                                </div>
                                <div className="truncate">
                                    <div className="text-xs font-semibold text-slate-700 truncate">{user.name}</div>
                                    <div className="text-[10px] text-slate-400 truncate capitalize">{user.role}</div>
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
                {/* Topbar */}
                <header className="h-16 border-b border-slate-200/85 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-30">
                    <div className="flex items-center gap-2.5">
                        {/* Status indicators like WhatsMark panel */}
                        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full text-[11px] text-emerald-700 font-semibold">
                            <Activity className="h-3.5 w-3.5 animate-pulse text-emerald-500" />
                            <span className="hidden sm:inline">WhatsApp Gateway:</span> Conectado
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full text-[11px] text-blue-700 font-semibold">
                            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                            <span>AI: Gemini 2.0 Flash</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-500 font-mono hidden md:inline">
                            Tenant: <span className="text-brand-teal font-bold">Demo Store</span>
                        </span>
                        
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
