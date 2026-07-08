<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Announcement;

class AnnouncementController extends Controller
{
    public function index()
    {
        return response()->json(Announcement::orderBy('id', 'asc')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'content' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $announcement = Announcement::create([
            'content' => $request->content,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json([
            'success' => true,
            'data' => $announcement
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Pengumuman tidak ditemukan.'
            ], 404);
        }

        $request->validate([
            'content' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $announcement->update($request->only(['content', 'is_active']));

        return response()->json([
            'success' => true,
            'data' => $announcement
        ]);
    }

    public function destroy($id)
    {
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Pengumuman tidak ditemukan.'
            ], 404);
        }

        $announcement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil dihapus.'
        ]);
    }
}
