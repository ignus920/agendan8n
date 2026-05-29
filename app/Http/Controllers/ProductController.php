<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return Inertia::render('Products/Index', [
            'products' => $products
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'duration_minutes' => 'nullable|integer|min:1',
            'repurchase_frequency_days' => 'nullable|integer|min:1',
            'tags' => 'nullable|array',
            'image_file' => 'nullable|image|max:5120',
            'is_featured' => 'boolean',
            'status' => 'required|string|in:active,inactive',
            'sort_order' => 'integer',
            'metadata' => 'nullable|array',
        ]);

        if ($request->hasFile('image_file')) {
            $path = $request->file('image_file')->store('products', 'public');
            $validated['images'] = ['/storage/' . $path];
        }

        Product::create($validated);

        return redirect()->back()->with('success', 'Producto creado exitosamente.');
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'duration_minutes' => 'nullable|integer|min:1',
            'repurchase_frequency_days' => 'nullable|integer|min:1',
            'tags' => 'nullable|array',
            'image_file' => 'nullable|image|max:5120',
            'is_featured' => 'boolean',
            'status' => 'required|string|in:active,inactive',
            'sort_order' => 'integer',
            'metadata' => 'nullable|array',
        ]);

        if ($request->hasFile('image_file')) {
            $path = $request->file('image_file')->store('products', 'public');
            $validated['images'] = ['/storage/' . $path];
        }

        $product->update($validated);

        return redirect()->back()->with('success', 'Producto actualizado exitosamente.');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return redirect()->back()->with('success', 'Producto eliminado exitosamente.');
    }
}
