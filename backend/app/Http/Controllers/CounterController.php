<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Counter;
use Illuminate\Validation\Rule;

class CounterController extends Controller
{
    public function index(Request $request)
    {
        $query = Counter::query();
        
        if ($request->has('id_kantor') && $request->query('id_kantor') !== '') {
            $query->where('id_kantor', $request->query('id_kantor'));
        }

        return response()->json($query->orderBy('id', 'asc')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_kantor' => 'required|string|exists:kantor,id_kantor',
            'name' => [
                'required',
                'string',
                // Unik untuk nama loket di cabang yang sama
                Rule::unique('counters')->where(function ($query) use ($request) {
                    return $query->where('id_kantor', $request->id_kantor);
                })
            ],
            'type' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $counter = Counter::create([
            'id_kantor' => $request->id_kantor,
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
            'id_kantor' => 'required|string|exists:kantor,id_kantor',
            'name' => [
                'required',
                'string',
                // Unik untuk nama loket di cabang yang sama, mengabaikan record saat ini
                Rule::unique('counters')->where(function ($query) use ($request) {
                    return $query->where('id_kantor', $request->id_kantor);
                })->ignore($id)
            ],
            'type' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $counter->update($request->only(['id_kantor', 'name', 'type', 'is_active']));

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
