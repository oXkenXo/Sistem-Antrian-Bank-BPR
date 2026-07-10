<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Queue;
use App\Models\InformasiPublik;
use Carbon\Carbon;

class QueueController extends Controller
{
    /**
     * Get the active queue state (waiting and calling) for a specific branch.
     */
    public function index(Request $request)
    {
        $request->validate([
            'id_kantor' => 'required|string',
        ]);

        $idKantor = $request->query('id_kantor');
        $today = Carbon::today();

        // Get calling and waiting queues for today at this specific branch
        $calling = Queue::where('created_at', '>=', $today)
            ->where('id_kantor', $idKantor)
            ->where('status', 'calling')
            ->orderBy('updated_at', 'desc')
            ->get();

        $waitingList = Queue::where('created_at', '>=', $today)
            ->where('id_kantor', $idKantor)
            ->where('status', 'waiting')
            ->orderBy('id', 'asc')
            ->get();

        // LOGIKA FALLBACK UNTUK RUNNING TEXT (Announcements):
        // Ambil running text aktif untuk cabang ini, dan jika tidak ada, gunakan global (null)
        $announcementItems = InformasiPublik::aktif()
            ->where('tipe', 'teks_bergulir')
            ->where(function($q) use ($idKantor) {
                $q->where('id_kantor', $idKantor)
                  ->orWhereNull('id_kantor');
            })
            ->get();

        $branchText = $announcementItems->where('id_kantor', $idKantor);
        if ($branchText->isEmpty()) {
            $announcements = $announcementItems->whereNull('id_kantor')->pluck('konten');
        } else {
            $announcements = $branchText->pluck('konten');
        }

        return response()->json([
            'calling' => $calling,
            'waiting' => $waitingList,
            'announcements' => $announcements,
            'stats' => [
                'total_waiting' => $waitingList->count(),
                'teller_waiting' => $waitingList->where('prefix', 'A')->count(),
                'kredit_waiting' => $waitingList->where('prefix', 'B')->count(),
                'cs_waiting' => $waitingList->where('prefix', 'C')->count(),
            ]
        ]);
    }

    /**
     * Create a new queue ticket (from Kiosk) at a specific branch.
     */
    public function store(Request $request)
    {
        $request->validate([
            'id_kantor' => 'required|string',
            'service_type' => 'required|string',
            'prefix' => 'required|string|max:1',
        ]);

        $today = Carbon::today();
        $prefix = strtoupper($request->prefix);
        $idKantor = $request->id_kantor;

        // Get the latest number today for this prefix at this specific branch
        $latestNumber = Queue::where('created_at', '>=', $today)
            ->where('id_kantor', $idKantor)
            ->where('prefix', $prefix)
            ->max('number') ?? 0;

        $nextNumber = $latestNumber + 1;
        $ticketNumber = $prefix . '-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

        $queue = Queue::create([
            'id_kantor' => $idKantor,
            'ticket_number' => $ticketNumber,
            'service_type' => $request->service_type,
            'prefix' => $prefix,
            'number' => $nextNumber,
            'status' => 'waiting',
        ]);

        return response()->json([
            'success' => true,
            'data' => $queue
        ], 201);
    }

    /**
     * Call the next waiting ticket for a counter at a specific branch.
     */
    public function callNext(Request $request)
    {
        $request->validate([
            'id_kantor' => 'required|string',
            'counter_name' => 'required|string',
            'service_type' => 'required|string',
        ]);

        $today = Carbon::today();
        $idKantor = $request->id_kantor;

        // 1. Mark any active calling ticket of this counter at this branch as completed
        Queue::where('created_at', '>=', $today)
            ->where('id_kantor', $idKantor)
            ->where('counter_name', $request->counter_name)
            ->where('status', 'calling')
            ->update(['status' => 'completed']);

        // 2. Fetch the next waiting ticket for the selected service type at this branch
        $nextQueue = Queue::where('created_at', '>=', $today)
            ->where('id_kantor', $idKantor)
            ->where('service_type', $request->service_type)
            ->where('status', 'waiting')
            ->orderBy('id', 'asc')
            ->first();

        if (!$nextQueue) {
            return response()->json([
                'success' => false,
                'message' => 'Antrean untuk kategori ini sedang kosong.'
            ], 404);
        }

        // 3. Update the ticket to calling with this counter's name
        $nextQueue->update([
            'status' => 'calling',
            'counter_name' => $request->counter_name,
        ]);

        return response()->json([
            'success' => true,
            'data' => $nextQueue
        ]);
    }

    /**
     * Recall current calling ticket.
     */
    public function recall(Request $request)
    {
        $request->validate([
            'queue_id' => 'required|integer',
        ]);

        $queue = Queue::find($request->queue_id);

        if (!$queue) {
            return response()->json([
                'success' => false,
                'message' => 'Antrean tidak ditemukan.'
            ], 404);
        }

        // Updating updated_at triggers the display to announce again
        $queue->touch();

        return response()->json([
            'success' => true,
            'data' => $queue
        ]);
    }

    /**
     * Complete the service of a ticket.
     */
    public function complete(Request $request)
    {
        $request->validate([
            'queue_id' => 'required|integer',
        ]);

        $queue = Queue::find($request->queue_id);

        if (!$queue) {
            return response()->json([
                'success' => false,
                'message' => 'Antrean tidak ditemukan.'
            ], 404);
        }

        $queue->update(['status' => 'completed']);

        return response()->json([
            'success' => true,
            'data' => $queue
        ]);
    }

    /**
     * Skip the service of a ticket.
     */
    public function skip(Request $request)
    {
        $request->validate([
            'queue_id' => 'required|integer',
        ]);

        $queue = Queue::find($request->queue_id);

        if (!$queue) {
            return response()->json([
                'success' => false,
                'message' => 'Antrean tidak ditemukan.'
            ], 404);
        }

        $queue->update(['status' => 'skip']);

        return response()->json([
            'success' => true,
            'data' => $queue
        ]);
    }

    /**
     * Reset today's queues for a specific branch.
     */
    public function resetQueues(Request $request)
    {
        $request->validate([
            'id_kantor' => 'required|string',
        ]);

        $today = Carbon::today();
        Queue::where('created_at', '>=', $today)
            ->where('id_kantor', $request->id_kantor)
            ->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Antrean hari ini berhasil direset.'
        ]);
    }
}
