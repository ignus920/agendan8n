import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { 
    Package, 
    Plus, 
    Trash2, 
    Edit3, 
    Check, 
    Clock, 
    RefreshCw, 
    Tag, 
    Star, 
    Image as ImageIcon,
    AlertCircle,
    X
} from 'lucide-react';

export default function ProductsIndex({ products }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        description: '',
        price: '',
        duration_minutes: '',
        repurchase_frequency_days: '',
        tags_input: '',
        image_url: '',
        is_featured: false,
        status: 'active',
        sort_order: 0,
    });

    const openCreateModal = () => {
        setEditingProduct(null);
        clearErrors();
        reset();
        setIsModalOpen(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        clearErrors();
        setData({
            name: product.name || '',
            description: product.description || '',
            price: product.price || '',
            duration_minutes: product.duration_minutes || '',
            repurchase_frequency_days: product.repurchase_frequency_days || '',
            tags_input: Array.isArray(product.tags) ? product.tags.join(', ') : '',
            image_url: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : '',
            is_featured: !!product.is_featured,
            status: product.status || 'active',
            sort_order: product.sort_order || 0,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Prepare tags and images arrays
        const tags = data.tags_input 
            ? data.tags_input.split(',').map(t => t.trim()).filter(Boolean)
            : [];
        const images = data.image_url ? [data.image_url] : [];

        const payload = {
            ...data,
            tags,
            images,
        };

        if (editingProduct) {
            put(route('products.update', editingProduct.id), {
                data: payload,
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('products.store'), {
                data: payload,
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (productId) => {
        if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
            destroy(route('products.destroy', productId));
        }
    };

    const formatPrice = (price) => {
        if (price === null || price === undefined) return '$0';
        return '$' + Number(price).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            Catálogo de Productos
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Administra los servicios, precios, duración y frecuencia de recompra para el bot.</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-bold shadow-md hover:bg-brand-teal/95 hover:shadow-lg transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Producto
                    </button>
                </div>
            }
        >
            <Head title="Productos" />

            {products.length === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm max-w-xl mx-auto mt-6">
                    <div className="h-12 w-12 rounded-2xl bg-brand-teal-light text-brand-teal flex items-center justify-center mx-auto mb-4">
                        <Package className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-850">No hay productos registrados</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                        Comienza registrando tu primer servicio o producto para que el bot pueda ofrecerlo a los clientes en WhatsApp.
                    </p>
                    <button
                        onClick={openCreateModal}
                        className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-bold shadow-md hover:bg-brand-teal/90 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Registrar Producto
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => {
                        const firstImage = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
                        
                        return (
                            <div 
                                key={product.id} 
                                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col group"
                            >
                                {/* Card Image / Icon Header */}
                                <div className="h-40 bg-slate-50 border-b border-slate-100 relative overflow-hidden flex items-center justify-center">
                                    {firstImage ? (
                                        <img 
                                            src={firstImage} 
                                            alt={product.name} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-350">
                                            <Package className="h-10 w-10 text-slate-300 group-hover:scale-110 transition-transform duration-300" />
                                            <span className="text-[10px] uppercase font-mono tracking-wider">Sin Imagen</span>
                                        </div>
                                    )}
                                    
                                    {/* Badges overlay */}
                                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                                        {product.is_featured && (
                                            <span className="bg-brand-orange text-white px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1 shadow-sm">
                                                <Star className="h-3 w-3 fill-white text-brand-orange" />
                                                Destacado
                                            </span>
                                        )}
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border shadow-sm ${
                                            product.status === 'active' 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' 
                                                : 'bg-slate-100 text-slate-500 border-slate-200/80'
                                        }`}>
                                            {product.status === 'active' ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>

                                    {/* Price Badge Overlay */}
                                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm border border-slate-150 px-3 py-1 rounded-xl shadow-sm">
                                        <span className="text-sm font-extrabold text-brand-teal">
                                            {formatPrice(product.price)}
                                        </span>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start gap-2 mb-1.5">
                                        <h4 className="font-bold text-slate-800 text-sm group-hover:text-brand-teal transition-colors truncate">
                                            {product.name}
                                        </h4>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                                        {product.description || 'Sin descripción disponible.'}
                                    </p>

                                    {/* Stats */}
                                    <div className="mt-auto grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                                            <span>Duración: <strong>{product.duration_minutes || '--'} min</strong></span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                                            <span>Recompra: <strong>{product.repurchase_frequency_days || '--'} días</strong></span>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    {Array.isArray(product.tags) && product.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-3.5">
                                            {product.tags.map((tag, i) => (
                                                <span key={i} className="text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200/80 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                                                    <Tag className="h-2.5 w-2.5 text-slate-400" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Card Footer Actions */}
                                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end">
                                    <button
                                        onClick={() => openEditModal(product)}
                                        className="p-1.5 text-slate-500 hover:text-brand-teal hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors"
                                        title="Editar Producto"
                                    >
                                        <Edit3 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors"
                                        title="Eliminar Producto"
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
                                    <Package className="h-5 w-5 text-brand-teal" />
                                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
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
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre del Producto *</label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            placeholder="Ej. Soporte Tecnológico VIP"
                                            className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors"
                                            required
                                        />
                                        {errors.name && <div className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.name}</div>}
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descripción</label>
                                        <textarea
                                            value={data.description}
                                            onChange={e => setData('description', e.target.value)}
                                            placeholder="Describe brevemente las características..."
                                            rows="3"
                                            className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors resize-none"
                                        />
                                        {errors.description && <div className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.description}</div>}
                                    </div>

                                    {/* Row of Price, Duration, Recount */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Precio (USD)</label>
                                            <input
                                                type="number"
                                                value={data.price}
                                                onChange={e => setData('price', e.target.value)}
                                                placeholder="0.00"
                                                className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors"
                                            />
                                            {errors.price && <div className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.price}</div>}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Duración (min)</label>
                                            <input
                                                type="number"
                                                value={data.duration_minutes}
                                                onChange={e => setData('duration_minutes', e.target.value)}
                                                placeholder="60"
                                                className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors"
                                            />
                                            {errors.duration_minutes && <div className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.duration_minutes}</div>}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1" title="Frecuencia con la que el bot recordará al cliente volver a comprar">Recompra (días)</label>
                                            <input
                                                type="number"
                                                value={data.repurchase_frequency_days}
                                                onChange={e => setData('repurchase_frequency_days', e.target.value)}
                                                placeholder="30"
                                                className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors"
                                            />
                                            {errors.repurchase_frequency_days && <div className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.repurchase_frequency_days}</div>}
                                        </div>
                                    </div>

                                    {/* Image URL */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">URL de la Imagen</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                <ImageIcon className="h-4 w-4" />
                                            </span>
                                            <input
                                                type="url"
                                                value={data.image_url}
                                                onChange={e => setData('image_url', e.target.value)}
                                                placeholder="https://ejemplo.com/imagen.jpg"
                                                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors"
                                            />
                                        </div>
                                        {errors.image_url && <div className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.image_url}</div>}
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tags (separados por coma)</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                <Tag className="h-4 w-4" />
                                            </span>
                                            <input
                                                type="text"
                                                value={data.tags_input}
                                                onChange={e => setData('tags_input', e.target.value)}
                                                placeholder="ej: vip, cloud, mantenimiento"
                                                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors"
                                            />
                                        </div>
                                        {errors.tags_input && <div className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.tags_input}</div>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Status */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estado</label>
                                            <select
                                                value={data.status}
                                                onChange={e => setData('status', e.target.value)}
                                                className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors"
                                            >
                                                <option value="active">Activo</option>
                                                <option value="inactive">Inactivo</option>
                                            </select>
                                        </div>

                                        {/* Sort Order */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Orden de visualización</label>
                                            <input
                                                type="number"
                                                value={data.sort_order}
                                                onChange={e => setData('sort_order', e.target.value)}
                                                className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-teal transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {/* Featured Checkbox */}
                                    <div className="flex items-center gap-2 pt-2">
                                        <input
                                            type="checkbox"
                                            id="is_featured"
                                            checked={data.is_featured}
                                            onChange={e => setData('is_featured', e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-brand-teal focus:ring-brand-teal"
                                        />
                                        <label htmlFor="is_featured" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                                            Destacar producto en la lista del bot (Destacado)
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
                                        {editingProduct ? 'Guardar Cambios' : 'Registrar'}
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
