import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Settings, Trash2, Edit } from 'lucide-react';
import Modal from '@/Components/Modal';

export default function Index({ auth, flows }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('visual-flows.store'), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset();
            },
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-slate-800 leading-tight">Editor Visual de Flujos (BETA)</h2>}
        >
            <Head title="Flujos Visuales" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-medium text-slate-900">Tus Flujos</h3>
                            <p className="text-sm text-slate-500">
                                Esta es una sección experimental para comparar el constructor visual vs las reglas basadas en JSON.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Flujo
                        </button>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-slate-900">
                            {flows.length === 0 ? (
                                <div className="text-center py-12">
                                    <Settings className="mx-auto h-12 w-12 text-slate-400" />
                                    <h3 className="mt-2 text-sm font-semibold text-slate-900">No hay flujos</h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Empieza creando tu primer flujo visual.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {flows.map((flow) => (
                                        <div key={flow.id} className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow bg-slate-50 flex flex-col">
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="text-lg font-semibold text-slate-800 line-clamp-1">{flow.name}</h4>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${flow.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                                                    {flow.is_active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 mb-6 flex-grow line-clamp-2">
                                                {flow.description || 'Sin descripción'}
                                            </p>
                                            <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-200">
                                                <Link 
                                                    href={route('visual-flows.edit', flow.id)}
                                                    className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                                >
                                                    <Edit className="w-4 h-4 mr-1" />
                                                    Abrir Editor
                                                </Link>
                                                <Link
                                                    href={route('visual-flows.destroy', flow.id)}
                                                    method="delete"
                                                    as="button"
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
                <form onSubmit={submit} className="p-6 bg-white">
                    <h2 className="text-lg font-medium text-slate-900">
                        Crear Nuevo Flujo Visual
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Dale un nombre a tu flujo para empezar a diseñarlo en el lienzo interactivo.
                    </p>

                    <div className="mt-6">
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nombre</label>
                        <input
                            type="text"
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1 block w-full border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            placeholder="Ej. Secuencia de Bienvenida"
                            required
                        />
                        {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                    </div>

                    <div className="mt-4">
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700">Descripción (Opcional)</label>
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className="mt-1 block w-full border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            rows="3"
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="mr-3 px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Crear e ir al Editor
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
