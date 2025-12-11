<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if ($request->isMethod('OPTIONS')) {
            return $next($request);
        }
        
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Check if user has any of the required roles
        foreach ($roles as $role) {
            if ($request->user()->hasRole($role)) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'Forbidden. You do not have the required role.',
            'required_roles' => $roles,
            'your_roles' => $request->user()->roles->pluck('name')
        ], 403);
    }
}