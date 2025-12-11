<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // <<< CRITICAL FIX: Allow OPTIONS preflight to pass through immediately. >>>
        if ($request->isMethod('OPTIONS')) {
            return $next($request);
        }
        // <<< END CRITICAL FIX >>>
        
        // 1. Check if the user is authenticated (The logic is now correct for non-OPTIONS methods)
        if (! $request->user()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // 2. Get the authenticated user's role
        $userRole = $request->user()->role ? $request->user()->role->name : null;
        
        // 3. Check if the user's role is included in the list of allowed roles
        if (in_array(strtolower($userRole), $roles)) {
            return $next($request); // Access granted
        }

        // 4. Access denied
        return response()->json(['message' => 'Forbidden. You do not have the required role.'], 403);
    }
}