<?php

namespace App\Http\Controllers;

use App\Models\Resource;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ResourceController extends Controller
{
    public function index()
    {
        $resources = Resource::with(['schedules', 'exceptions'])
            ->orderBy('name')
            ->get();

        return Inertia::render('Resources/Index', [
            'resources' => $resources,
            'types' => Resource::TYPES
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:person,room,equipment,vehicle',
            'description' => 'nullable|string',
            'capacity' => 'required|integer|min:1',
            'is_active' => 'boolean',
            'metadata' => 'nullable|array',
        ]);

        Resource::create($validated);

        return redirect()->back()->with('success', 'Recurso creado exitosamente.');
    }

    public function update(Request $request, Resource $resource)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:person,room,equipment,vehicle',
            'description' => 'nullable|string',
            'capacity' => 'required|integer|min:1',
            'is_active' => 'boolean',
            'metadata' => 'nullable|array',
        ]);

        $resource->update($validated);

        return redirect()->back()->with('success', 'Recurso actualizado exitosamente.');
    }

    public function destroy(Resource $resource)
    {
        $resource->delete();

        return redirect()->back()->with('success', 'Recurso eliminado exitosamente.');
    }
}
