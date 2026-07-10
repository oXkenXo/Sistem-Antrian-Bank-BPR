<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CloseConnection
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);
        
        // Force the single-threaded PHP server to close the connection immediately.
        // This prevents Keep-Alive from blocking the single-threaded PHP dev server on Windows.
        $response->headers->set('Connection', 'close');
        
        return $response;
    }
}
