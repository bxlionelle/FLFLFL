<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\LoginUserRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Spatie\Permission\Models\Role;

class AuthController extends Controller
{
    /**
     * Register new user
     */
    public function store(StoreUserRequest $request)
    {
        // ... (No changes here, registration logic remains the same)
        $validated = $request->validated();

        $roleId = $validated['role_id'] ?? null;
        unset($validated['role_id']);

        $validated['password'] = Hash::make($validated['password']);
        unset($validated['password_confirmation']);

        $user = User::create($validated);

        if ($roleId) {
            $role = Role::findOrFail($roleId);
            $user->assignRole($role->name);
        }

        return response()->json([
            'user' => $user->load('roles')
        ], 201);
    }

    /**
     * Sanctum API Token Login (UPDATED)
     */
    public function login(LoginUserRequest $request)
    {
        $credentials = $request->only('email', 'password');

        if (!Auth::attempt($credentials)) {
            // Returns 401 Unauthorized if credentials fail
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // --- API TOKEN GENERATION ---
        $user = Auth::user();
        
        // 1. Determine the user's primary role for the token name/abilities
        $roleName = $user->getRoleNames()->first() ?? 'plain-token';

        // 2. Create a new token (you can customize the abilities array)
        $token = $user->createToken($roleName, ['server:read', 'server:write'])->plainTextToken;

        // 3. Return the token and user data
        return response()->json([
            'user' => $user->load('roles'),
            'token' => $token, // <-- NEW: The Angular frontend will store this
        ]);
        // --- END API TOKEN GENERATION ---
    }

    /**
     * Get logged-in user
     */
    public function user(Request $request)
    {
        return response()->json($request->user()->load('roles'));
    }

    /**
     * Sanctum API Token Logout (UPDATED)
     */
    public function destroy(Request $request)
    {
        // --- API TOKEN REVOCATION ---
        // Revoke the token that was used to authenticate the current request
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Token revoked, user logged out']);
        // --- END API TOKEN REVOCATION ---
    }
}