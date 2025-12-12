<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request)
    {
        $users = User::with('roles')
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('firstname', 'like', "%{$search}%")
                      ->orWhere('lastname', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->get()
            ->map(function ($user) {
                $firstRole = $user->roles->first();
                return [
                    'id' => $user->id,
                    'firstname' => $user->firstname,
                    'middlename' => $user->middlename,
                    'lastname' => $user->lastname,
                    'name' => trim($user->firstname . ' ' . $user->lastname),
                    'avatar' => strtoupper(substr($user->firstname ?? '', 0, 1) . substr($user->lastname ?? '', 0, 1)),
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'bio' => $user->bio,
                    'is_active' => $user->is_active,
                    'role_id' => $firstRole?->id,
                    'role' => $firstRole ? [
                        'id' => $firstRole->id,
                        'name' => strtolower($firstRole->name),
                    ] : null,
                ];
            });

        return response()->json(['data' => $users]);
    }

    /**
     * Display a single user.
     */
    public function show(string $id)
    {
        try {
            $user = User::with('roles')->findOrFail($id);
            $firstRole = $user->roles->first();

            $transformedUser = [
                'id' => $user->id,
                'firstname' => $user->firstname,
                'middlename' => $user->middlename,
                'lastname' => $user->lastname,
                'name' => trim($user->firstname . ' ' . $user->lastname),
                'avatar' => strtoupper(substr($user->firstname ?? '', 0, 1) . substr($user->lastname ?? '', 0, 1)),
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'bio' => $user->bio,
                'is_active' => $user->is_active,
                'role_id' => $firstRole?->id,
                'role' => $firstRole ? [
                    'id' => $firstRole->id,
                    'name' => strtolower($firstRole->name),
                ] : null,
                'roles' => $user->roles,
            ];

            return response()->json([
                'success' => true,
                'data' => $transformedUser
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update authenticated user's profile.
     */
    public function updateProfile(Request $request)
    {
        try {
            $user = $request->user();

            $validated = $request->validate([
                'firstname' => 'sometimes|string|max:255',
                'middlename' => 'nullable|string|max:255',
                'lastname' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $user->id,
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string',
                'bio' => 'nullable|string',
            ]);

            $user->update($validated);
            $user->load('roles');
            $firstRole = $user->roles->first();

            $transformedUser = [
                'id' => $user->id,
                'firstname' => $user->firstname,
                'middlename' => $user->middlename,
                'lastname' => $user->lastname,
                'name' => trim($user->firstname . ' ' . $user->lastname),
                'avatar' => strtoupper(substr($user->firstname ?? '', 0, 1) . substr($user->lastname ?? '', 0, 1)),
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'bio' => $user->bio,
                'is_active' => $user->is_active,
                'role_id' => $firstRole?->id,
                'role' => $firstRole ? [
                    'id' => $firstRole->id,
                    'name' => strtolower($firstRole->name),
                ] : null,
                'roles' => $user->roles,
            ];

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'user' => $transformedUser
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating profile: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update any user (admin).
     */
    public function update(Request $request, string $id)
    {
        try {
            $user = User::findOrFail($id);

            $validated = $request->validate([
                'firstname' => 'sometimes|string|max:255',
                'middlename' => 'nullable|string|max:255',
                'lastname' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $id,
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string',
                'bio' => 'nullable|string',
                'is_active' => 'sometimes|boolean',
                'role_id' => 'sometimes|exists:roles,id',
                'role_name' => 'sometimes|string|exists:roles,name',
            ]);

            $user->update($validated);

            if ($request->has('role_id')) {
                $role = \Spatie\Permission\Models\Role::findOrFail($request->role_id);
                $user->syncRoles([$role->name]);
            } elseif ($request->has('role_name')) {
                $user->syncRoles([$request->role_name]);
            }

            $user->load('roles');
            $firstRole = $user->roles->first();

            $transformedUser = [
                'id' => $user->id,
                'firstname' => $user->firstname,
                'middlename' => $user->middlename,
                'lastname' => $user->lastname,
                'name' => trim($user->firstname . ' ' . $user->lastname),
                'avatar' => strtoupper(substr($user->firstname ?? '', 0, 1) . substr($user->lastname ?? '', 0, 1)),
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'bio' => $user->bio,
                'is_active' => $user->is_active,
                'role_id' => $firstRole?->id,
                'role' => $firstRole ? [
                    'id' => $firstRole->id,
                    'name' => strtolower($firstRole->name),
                ] : null,
                'roles' => $user->roles,
            ];

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => $transformedUser
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error updating user: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a user.
     */
    public function destroy(string $id)
    {
        $user = User::findOrFail($id);

        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'You cannot delete your own account'], 403);
        }

        $user->delete();
        return response()->json(['message' => 'User deleted successfully'], 200);
    }

    /**
     * Get total/active/inactive user counts.
     */
    public function getUserCount()
    {
        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->count();

        return response()->json([
            'total' => $totalUsers,
            'active' => $activeUsers,
            'inactive' => $totalUsers - $activeUsers,
        ]);
    }

    /**
     * List all users for task assignment (Angular select dropdown).
     */
    public function allUsersForAssignment()
    {
        $users = User::with('roles')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => trim($user->firstname . ' ' . $user->lastname),
                'avatar' => strtoupper(substr($user->firstname ?? '', 0, 1) . substr($user->lastname ?? '', 0, 1)),
                'role' => strtolower($user->roles->first()?->name ?? ''),
            ];
        });

        return response()->json(['data' => $users]);
    }
}
