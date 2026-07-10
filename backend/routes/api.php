<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

use App\Http\Controllers\QueueController;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/queues/status', [QueueController::class, 'index']);
Route::post('/queues/store', [QueueController::class, 'store']);
Route::post('/queues/call-next', [QueueController::class, 'callNext']);
Route::post('/queues/recall', [QueueController::class, 'recall']);
Route::post('/queues/complete', [QueueController::class, 'complete']);
Route::post('/queues/skip', [QueueController::class, 'skip']);
Route::post('/queues/reset', [QueueController::class, 'resetQueues']);

Route::apiResource('counters', \App\Http\Controllers\CounterController::class);

// BI Rate (Suku Bunga Bank Indonesia)
Route::get('/interest-rate', [\App\Http\Controllers\InterestRateController::class, 'getRate']);

// Informasi Publik (Galeri Gambar & Video YouTube untuk Display)
Route::get('/informasi-publik/aktif', [\App\Http\Controllers\InformasiPublikController::class, 'aktif']);
Route::apiResource('informasi-publik', \App\Http\Controllers\InformasiPublikController::class);

// Daftar Kantor Cabang
Route::get('/branches', function() {
    return response()->json(\App\Models\Kantor::orderBy('id_kantor', 'asc')->get());
});

// API Login Petugas & Admin per Cabang
Route::post('/login', function (Request $request) {
    $credentials = $request->validate([
        'email' => 'required|email',
        'password' => 'required',
        'id_kantor' => 'required|string',
    ]);

    $user = \App\Models\User::where('email', $credentials['email'])->first();

    if (! $user || ! \Illuminate\Support\Facades\Hash::check($credentials['password'], $user->password)) {
        return response()->json([
            'message' => 'Email atau password salah.'
        ], 401);
    }

    // Validasi Kantor Cabang: petugas hanya boleh masuk ke cabang tempat dia ditugaskan.
    // Admin Pusat (id_kantor = '01') memiliki hak akses bebas untuk semua cabang.
    if ($user->role !== 'admin' && $user->id_kantor !== $credentials['id_kantor']) {
        return response()->json([
            'message' => 'Akun Anda tidak terdaftar di cabang ini!'
        ], 403);
    }

    return response()->json([
        'success' => true,
        'user' => [
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'id_kantor' => $user->id_kantor,
        ]
    ]);
});
