<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // 1. Check if the user is authenticated
        if (! $request->user()) {
            // Returns a 401 Unauthorized response if the user is not logged in
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // 2. Get the authenticated user's role (assuming your User model has a 'role' or a roles relationship)
        $userRole = $request->user()->role ? $request->user()->role->name : null;
        
        // 3. Check if the user's role is included in the list of allowed roles
        // We convert the user's role to lowercase for case-insensitive matching
        if (in_array(strtolower($userRole), $roles)) {
            return $next($request); // Access granted
        }

        // 4. Access denied
        return response()->json(['message' => 'Forbidden. You do not have the required role.'], 403);
    }
}