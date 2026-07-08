<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Counter;

class CounterController extends Controller
{
    public function index()
    {
        return response()->json(Counter::orderBy('id', 'asc')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:counters,name',
            'type' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $counter = Counter::create([
            'name' => $request->name,
            'type' => $request->type,
            'is_active' => $request->is_active ?? false,
        ]);

        return response()->json([
            'success' => true,
            'data' => $counter
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $counter = Counter::find($id);

        if (!$counter) {
            return response()->json([
                'success' => false,
                'message' => 'Loket tidak ditemukan.'
            ], 404);
        }

        $request->validate([
            'name' => 'required|string|unique:counters,name,' . $id,
            'type' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $counter->update($request->only(['name', 'type', 'is_active']));

        return response()->json([
            'success' => true,
            'data' => $counter
        ]);
    }

    public function destroy($id)
    {
        $counter = Counter::find($id);

        if (!$counter) {
            return response()->json([
                'success' => false,
                'message' => 'Loket tidak ditemukan.'
            ], 404);
        }

        $counter->delete();

        return response()->json([
            'success' => true,
            'message' => 'Loket berhasil dihapus.'
        ]);
    }
}
