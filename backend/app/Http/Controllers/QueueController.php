<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Queue;
use Carbon\Carbon;

class QueueController extends Controller
{
    /**
     * Get the active queue state (waiting and calling).
     */
    public function index()
    {
        $today = Carbon::today();

        // Get calling and waiting queues for today
        $calling = Queue::where('created_at', '>=', $today)
            ->where('status', 'calling')
            ->orderBy('updated_at', 'desc')
            ->get();

        $waitingList = Queue::where('created_at', '>=', $today)
            ->where('status', 'waiting')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'calling' => $calling,
            'waiting' => $waitingList,
            'stats' => [
                'total_waiting' => $waitingList->count(),
                'teller_waiting' => $waitingList->where('prefix', 'A')->count(),
                'kredit_waiting' => $waitingList->where('prefix', 'B')->count(),
                'cs_waiting' => $waitingList->where('prefix', 'C')->count(),
            ]
        ]);
    }

    /**
     * Create a new queue ticket (from Kiosk).
     */
    public function store(Request $request)
    {
        $request->validate([
            'service_type' => 'required|string',
            'prefix' => 'required|string|max:1',
        ]);

        $today = Carbon::today();
        $prefix = strtoupper($request->prefix);

        // Get the latest number today for this prefix
        $latestNumber = Queue::where('created_at', '>=', $today)
            ->where('prefix', $prefix)
            ->max('number') ?? 0;

        $nextNumber = $latestNumber + 1;
        $ticketNumber = $prefix . '-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

        $queue = Queue::create([
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
}
