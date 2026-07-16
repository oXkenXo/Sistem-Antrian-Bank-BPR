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
     *
     * Logika fallback:
     * - Jika cabang TIDAK memiliki data AKTIF sama sekali untuk suatu tipe, gunakan data global (id_kantor IS NULL).
     * - Jika cabang memiliki data AKTIF, tampilkan data cabang (data nonaktif/expired diabaikan).
     * - Jika cabang memiliki data (aktif atau nonaktif) di DB, dia dianggap "mengelola sendiri" —
     *   global hanya jadi fallback jika semua data cabang NONAKTIF.
     */
    public function aktif(Request $request)
    {
        $idKantor = $request->query('id_kantor');

        if (!$idKantor) {
            // Jika tidak ada parameter cabang, tampilkan yang global saja
            $data = InformasiPublik::aktif()->whereNull('id_kantor')->get();
            return response()->json($data);
        }

        // Cek apakah cabang ini memiliki data AKTIF untuk media (gambar/youtube)
        $hasActiveBranchMedia = InformasiPublik::aktif()
            ->where('id_kantor', $idKantor)
            ->whereIn('tipe', ['gambar', 'youtube'])->exists();

        // Cek apakah cabang ini memiliki data AKTIF untuk running text
        $hasActiveBranchText = InformasiPublik::aktif()
            ->where('id_kantor', $idKantor)
            ->where('tipe', 'teks_bergulir')->exists();

        // Cek apakah cabang ini PERNAH memiliki data (aktif atau tidak) untuk menentukan
        // apakah cabang sudah mengelola kontennya sendiri
        $everHasBranchMedia = InformasiPublik::where('id_kantor', $idKantor)
            ->whereIn('tipe', ['gambar', 'youtube'])->exists();
        $everHasBranchText = InformasiPublik::where('id_kantor', $idKantor)
            ->where('tipe', 'teks_bergulir')->exists();

        // Ambil konten aktif khusus cabang tersebut
        $branchKonten = InformasiPublik::aktif()->where('id_kantor', $idKantor)->get();

        // Pisahkan konten berdasarkan tipe
        $branchMedia = $branchKonten->whereIn('tipe', ['gambar', 'youtube']);
        $branchText = $branchKonten->where('tipe', 'teks_bergulir');

        // FALLBACK MEDIA:
        // Jika cabang TIDAK memiliki data AKTIF, dan juga BELUM PERNAH mengelola data sendiri,
        // TAMPILKAN data global
        if (!$hasActiveBranchMedia && !$everHasBranchMedia) {
            $branchMedia = InformasiPublik::aktif()->whereNull('id_kantor')->whereIn('tipe', ['gambar', 'youtube'])->get();
        } elseif (!$hasActiveBranchMedia && $everHasBranchMedia) {
            // Cabang pernah punya data tapi semuanya nonaktif — tetap tampilkan kosong (tidak fallback ke global)
            $branchMedia = collect();
        }

        // FALLBACK TEXT:
        // Sama seperti media
        if (!$hasActiveBranchText && !$everHasBranchText) {
            $branchText = InformasiPublik::aktif()->whereNull('id_kantor')->where('tipe', 'teks_bergulir')->get();
        } elseif (!$hasActiveBranchText && $everHasBranchText) {
            $branchText = collect();
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
            'tanggal_kadaluarsa'  => 'nullable|date|after_or_equal:tanggal_berlaku',
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
