<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Queue;
use App\Models\Counter;
use App\Models\InformasiPublik;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

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

        $counters = \App\Models\Counter::where('id_kantor', $idKantor)->where('is_active', true)->orderBy('urutan')->get();

        return response()->json([
            'calling' => $calling,
            'waiting' => $waitingList,
            'announcements' => $announcements,
            'counters' => $counters,
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
     * Menggunakan DB transaction + lockForUpdate untuk mencegah race condition duplikasi nomor.
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

        // Gunakan DB transaction dengan lock untuk mencegah duplikasi nomor pada request bersamaan
        $queue = DB::transaction(function () use ($today, $prefix, $idKantor, $request) {
            // Lock baris untuk mencegah race condition
            $latestNumber = Queue::where('created_at', '>=', $today)
                ->where('id_kantor', $idKantor)
                ->where('prefix', $prefix)
                ->lockForUpdate()
                ->max('number') ?? 0;

            $nextNumber = $latestNumber + 1;
            $ticketNumber = $prefix . '-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

            return Queue::create([
                'id_kantor' => $idKantor,
                'ticket_number' => $ticketNumber,
                'service_type' => $request->service_type,
                'prefix' => $prefix,
                'number' => $nextNumber,
                'status' => 'waiting',
            ]);
        });

        return response()->json([
            'success' => true,
            'data' => $queue
        ], 201);
    }

    /**
     * Call the next waiting ticket for a counter at a specific branch.
     * Memvalidasi bahwa counter_name terdaftar di cabang ini dengan service_type yang sesuai.
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

        // Validasi: Pastikan counter/nama loket benar-benar terdaftar di cabang ini
        $counter = Counter::where('name', $request->counter_name)
            ->where('id_kantor', $idKantor)
            ->first();

        if (!$counter) {
            return response()->json([
                'success' => false,
                'message' => 'Loket tidak terdaftar di cabang ini.'
            ], 403);
        }

        // Validasi: Pastikan service_type sesuai dengan tipe loket
        if ($counter->type !== $request->service_type) {
            return response()->json([
                'success' => false,
                'message' => "Loket {$request->counter_name} adalah {$counter->type}, bukan {$request->service_type}."
            ], 403);
        }

        // Cari antrean berikutnya TERLEBIH DAHULU
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

        // Hanya complete tiket aktif jika benar-benar ada antrean berikutnya
        DB::transaction(function () use ($today, $idKantor, $request, $nextQueue) {
            Queue::where('created_at', '>=', $today)
                ->where('id_kantor', $idKantor)
                ->where('counter_name', $request->counter_name)
                ->where('status', 'calling')
                ->lockForUpdate()
                ->update(['status' => 'completed']);

            // Update the ticket to calling with this counter's name
            $nextQueue->update([
                'status' => 'calling',
                'counter_name' => $request->counter_name,
            ]);
        });

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
