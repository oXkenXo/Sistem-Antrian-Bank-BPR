<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\InformasiPublik;

class InformasiPublikController extends Controller
{
    /**
     * List semua informasi (untuk manajemen di /counter)
     */
    public function index(Request $request)
    {
        $query = InformasiPublik::query();
        
        // Filter berdasarkan id_kantor jika dikirim dari frontend
        if ($request->has('id_kantor') && $request->query('id_kantor') !== '') {
            $query->where('id_kantor', $request->query('id_kantor'));
        }

        $data = $query->orderBy('urutan', 'asc')->orderBy('id', 'desc')->get();
        return response()->json($data);
    }

    /**
     * Hanya yang aktif & belum kadaluarsa dengan LOGIKA FALLBACK (untuk /display)
     */
    public function aktif(Request $request)
    {
        $idKantor = $request->query('id_kantor');

        if (!$idKantor) {
            // Jika tidak ada parameter cabang, tampilkan yang global saja
            $data = InformasiPublik::aktif()->whereNull('id_kantor')->get();
            return response()->json($data);
        }

        // Cek apakah cabang ini memiliki data sama sekali (baik aktif maupun tidak)
        $hasBranchMedia = InformasiPublik::where('id_kantor', $idKantor)->whereIn('tipe', ['gambar', 'youtube'])->exists();
        $hasBranchText = InformasiPublik::where('id_kantor', $idKantor)->where('tipe', 'teks_bergulir')->exists();

        // Ambil konten aktif khusus cabang tersebut
        $branchKonten = InformasiPublik::aktif()->where('id_kantor', $idKantor)->get();

        // Pisahkan konten berdasarkan tipe media (iklan kanan) dan running text (teks bergulir)
        $branchMedia = $branchKonten->whereIn('tipe', ['gambar', 'youtube']);
        $branchText = $branchKonten->where('tipe', 'teks_bergulir');

        // FALLBACK 1: Jika cabang tidak memiliki data media SAMA SEKALI di DB, gunakan iklan/media pusat (global)
        if (!$hasBranchMedia) {
            $branchMedia = InformasiPublik::aktif()->whereNull('id_kantor')->whereIn('tipe', ['gambar', 'youtube'])->get();
        }

        // FALLBACK 2: Jika cabang tidak memiliki data running text SAMA SEKALI di DB, gunakan running text pusat (global)
        if (!$hasBranchText) {
            $branchText = InformasiPublik::aktif()->whereNull('id_kantor')->where('tipe', 'teks_bergulir')->get();
        }

        // Gabungkan kembali konten media dan running text
        $result = $branchMedia->merge($branchText)->sortBy('urutan')->values();

        return response()->json($result);
    }

    /**
     * Tambah informasi baru
     */
    public function store(Request $request)
    {
        $request->validate([
            'id_kantor'           => 'nullable|string|exists:kantor,id_kantor',
            'judul'               => 'required|string|max:255',
            'tipe'                => 'required|in:gambar,youtube,teks_bergulir',
            'konten'              => 'required|string',
            'tanggal_berlaku'     => 'nullable|date',
            'tanggal_kadaluarsa'  => 'nullable|date|after_or_equal:tanggal_berlaku',
            'is_active'           => 'boolean',
            'urutan'              => 'integer|min:0',
        ]);

        $info = InformasiPublik::create([
            'id_kantor'           => $request->id_kantor,
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
            'id_kantor'           => 'nullable|string|exists:kantor,id_kantor',
            'judul'               => 'required|string|max:255',
            'tipe'                => 'required|in:gambar,youtube,teks_bergulir',
            'konten'              => 'required|string',
            'tanggal_berlaku'     => 'nullable|date',
            'tanggal_kadaluarsa'  => 'nullable|date',
            'is_active'           => 'boolean',
            'urutan'              => 'integer|min:0',
        ]);

        $info->update($request->only([
            'id_kantor', 'judul', 'tipe', 'konten',
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
