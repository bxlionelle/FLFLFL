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
        $validated = $request->validated();

        $roleId = $validated['role_id'] ?? null;
        unset($validated['role_id']);

        $validated['password'] = Hash::make($validated['password']);
        unset($validated['password_confirmation']);

        $user = User::create($validated);

        if ($roleId) {
            $role = Role::findOrFail($roleId);
            $user->assignRole($role->name);
        } else {
            $user->assignRole('member'); // Default role
        }

        // Create token for new user
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'access_token' => $token,  // ✅ Changed from 'token' to 'access_token'
            'token_type' => 'Bearer',
            'user' => $user->load('roles')
        ], 201);
    }

    /**
     * Sanctum API Token Login (FIXED)
     */
    public function login(LoginUserRequest $request)
    {
        $credentials = $request->only('email', 'password');

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        $user = Auth::user();

        // Check if user is active
        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account has been deactivated'
            ], 403);
        }

        // Delete old tokens (optional - for security)
        $user->tokens()->delete();

        // Create new token
        $token = $user->createToken('auth_token')->plainTextToken;

        // Load roles
        $user->load('roles');

        return response()->json([
            'success' => true,
            'access_token' => $token,  // ✅ Changed from 'token' to 'access_token'
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'firstname' => $user->firstname,
                'middlename' => $user->middlename,
                'lastname' => $user->lastname,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'bio' => $user->bio,
                'is_active' => $user->is_active,
                'role' => $user->roles->first(), // First role as object
                'roles' => $user->roles->map(fn($role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                ]),
            ],
        ]);
    }

    /**
     * Get logged-in user
     */
    public function user(Request $request)
    {
        return response()->json([
            'success' => true,
            'user' => $request->user()->load('roles')
        ]);
    }

    /**
     * Sanctum API Token Logout
     */
    public function destroy(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }
}