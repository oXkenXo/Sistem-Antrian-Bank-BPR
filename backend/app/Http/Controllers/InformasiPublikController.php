<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\InformasiPublik;

class InformasiPublikController extends Controller
{
    /**
     * List semua informasi (untuk manajemen di /counter)
     */
    public function index()
    {
        $data = InformasiPublik::orderBy('urutan', 'asc')->orderBy('id', 'desc')->get();
        return response()->json($data);
    }

    /**
     * Hanya yang aktif & belum kadaluarsa (untuk /display)
     */
    public function aktif()
    {
        $data = InformasiPublik::aktif()->get();
        return response()->json($data);
    }

    /**
     * Tambah informasi baru
     */
    public function store(Request $request)
    {
        $request->validate([
            'judul'               => 'required|string|max:255',
            'tipe'                => 'required|in:gambar,youtube',
            'konten'              => 'required|string',
            'tanggal_berlaku'     => 'nullable|date',
            'tanggal_kadaluarsa'  => 'nullable|date|after_or_equal:tanggal_berlaku',
            'is_active'           => 'boolean',
            'urutan'              => 'integer|min:0',
        ]);

        $info = InformasiPublik::create([
            'judul'               => $request->judul,
            'tipe'                => $request->tipe,
            'konten'              => $request->konten,
            'tanggal_berlaku'     => $request->tanggal_berlaku,
            'tanggal_kadaluarsa'  => $request->tanggal_kadaluarsa,
            'is_active'           => $request->is_active ?? true,
            'urutan'              => $request->urutan ?? 0,
        ]);

        return response()->json([
            'success' => true,
            'data'    => $info,
        ], 201);
    }

    /**
     * Update informasi
     */
    public function update(Request $request, $id)
    {
        $info = InformasiPublik::find($id);
        if (!$info) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan.'], 404);
        }

        $request->validate([
            'judul'               => 'required|string|max:255',
            'tipe'                => 'required|in:gambar,youtube',
            'konten'              => 'required|string',
            'tanggal_berlaku'     => 'nullable|date',
            'tanggal_kadaluarsa'  => 'nullable|date',
            'is_active'           => 'boolean',
            'urutan'              => 'integer|min:0',
        ]);

        $info->update($request->only([
            'judul', 'tipe', 'konten',
            'tanggal_berlaku', 'tanggal_kadaluarsa',
            'is_active', 'urutan',
        ]));

        return response()->json(['success' => true, 'data' => $info]);
    }

    /**
     * Hapus informasi
     */
    public function destroy($id)
    {
        $info = InformasiPublik::find($id);
        if (!$info) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan.'], 404);
        }

        $info->delete();

        return response()->json(['success' => true, 'message' => 'Informasi berhasil dihapus.']);
    }
}
