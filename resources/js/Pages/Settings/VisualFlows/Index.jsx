import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Plus, Settings, Edit, Pencil } from 'lucide-react';
import Modal from '@/Components/Modal';

export default function Index({ auth, flows }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingFlow, setEditingFlow] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
    });

    const editForm = useForm({
        name: '',
        description: '',
    });

    const submitCreate = (e) => {
        e.preventDefault();
        post(route('visual-flows.store'), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset();
            },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(route('visual-flows.update', editingFlow.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setEditingFlow(null);
                editForm.reset();
            },
        });
    };

    const openEditModal = (flow) => {
        setEditingFlow(flow);
        editForm.setData({
            name: flow.name,
            description: flow.description || '',
        });
        setIsEditModalOpen(true);
    };

    const toggleFlowStatus = (flow) => {
        router.put(route('visual-flows.update', flow.id), {
            is_active: !flow.is_active
        }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-slate-800 leading-tight">Automatizaciones Visuales</h2>}
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
                                        <div key={flow.id} className={`border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col ${flow.is_active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-80'}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-lg font-semibold text-slate-800 line-clamp-1">{flow.name}</h4>
                                                    <button onClick={() => openEditModal(flow)} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Editar Información">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${flow.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'}`}>
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
                                                
                                                <div className="flex items-center gap-2" title={flow.is_active ? 'Desactivar Flujo' : 'Activar Flujo'}>
                                                    <span className="text-xs text-slate-500 font-medium select-none">Estado</span>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            className="sr-only peer" 
                                                            checked={!!flow.is_active} 
                                                            onChange={() => toggleFlowStatus(flow)} 
                                                        />
                                                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                                    </label>
                                                </div>
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
                <form onSubmit={submitCreate} className="p-6 bg-white">
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

            <Modal show={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
                <form onSubmit={submitEdit} className="p-6 bg-white">
                    <h2 className="text-lg font-medium text-slate-900">
                        Editar Flujo Visual
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Modifica la información básica del flujo.
                    </p>

                    <div className="mt-6">
                        <label htmlFor="edit_name" className="block text-sm font-medium text-slate-700">Nombre</label>
                        <input
                            type="text"
                            id="edit_name"
                            value={editForm.data.name}
                            onChange={(e) => editForm.setData('name', e.target.value)}
                            className="mt-1 block w-full border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            required
                        />
                        {editForm.errors.name && <div className="text-red-500 text-sm mt-1">{editForm.errors.name}</div>}
                    </div>

                    <div className="mt-4">
                        <label htmlFor="edit_description" className="block text-sm font-medium text-slate-700">Descripción (Opcional)</label>
                        <textarea
                            id="edit_description"
                            value={editForm.data.description}
                            onChange={(e) => editForm.setData('description', e.target.value)}
                            className="mt-1 block w-full border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            rows="3"
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="mr-3 px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={editForm.processing}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
