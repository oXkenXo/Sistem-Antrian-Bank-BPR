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
Route::apiResource('announcements', \App\Http\Controllers\AnnouncementController::class);

// BI Rate (Suku Bunga Bank Indonesia)
Route::get('/interest-rate', [\App\Http\Controllers\InterestRateController::class, 'getRate']);

// Informasi Publik (Galeri Gambar & Video YouTube untuk Display)
Route::get('/informasi-publik/aktif', [\App\Http\Controllers\InformasiPublikController::class, 'aktif']);
Route::apiResource('informasi-publik', \App\Http\Controllers\InformasiPublikController::class);
