<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project; // Assume Project Model exists
use App\Http\Requests\ProjectStoreRequest; // Assume Form Requests exist

class ProjectController extends Controller
{
    /**
     * Display a listing of projects accessible by the authenticated user.
     * Accessible by Admin (all) and PM (only managed).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $userRole = $user->roles->first()?->name;

        $query = Project::with(['client', 'manager', 'teamMembers']);

        // Filter based on user role
        switch (strtolower($userRole)) {
            case 'member':
                // Show only projects where user is a team member
                $query->whereHas('teamMembers', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                });
                break;

            case 'project_manager':
                // Show only projects created by this manager
                $query->where(function ($q) use ($user) {
                    $q->where('created_by', $user->id)
                      ->orWhere('manager_id', $user->id);
                });
                break;

            case 'client':
                // Show only projects assigned to this client
                $query->where('client_id', $user->id);
                break;

            case 'administrator':
                // Admin sees all projects
                break;

            default:
                // No access if role not recognized
                return response()->json(['data' => []]);
        }

        $projects = $query->get()->map(function ($project) use ($userRole) {
            $data = [
                'id' => $project->id,
                'name' => $project->name,
                'status' => $project->status,
                'progress' => $project->progress ?? 0,
                'deadline' => $project->end_date,
                'created_by' => $project->created_by,
                'manager_id' => $project->manager_id,
                'client_id' => $project->client_id,
            ];

            // Include client info for project managers
            if (strtolower($userRole) === 'project_manager' && $project->client) {
                $data['client'] = [
                    'name' => $project->client->firstname . ' ' . $project->client->lastname,
                    'email' => $project->client->email
                ];
            }

            // Include manager info for clients
            if (strtolower($userRole) === 'client' && $project->manager) {
                $data['manager'] = [
                    'name' => $project->manager->firstname . ' ' . $project->manager->lastname,
                    'email' => $project->manager->email
                ];
            }

            // Include team members for members and managers
            if (in_array(strtolower($userRole), ['member', 'project_manager'])) {
                $data['team_members'] = $project->teamMembers ? $project->teamMembers->map(function ($member) {
                    return [
                        'id' => $member->id,
                        'name' => $member->firstname . ' ' . $member->lastname,
                        'avatar' => strtoupper(substr($member->firstname ?? '', 0, 1) . substr($member->lastname ?? '', 0, 1))
                    ];
                })->toArray() : [];
            } else {
                $data['team_members'] = [];
            }

            return $data;
        });

        return response()->json(['data' => $projects]);
    }

    /**
     * Store a newly created resource in storage (Admin/PM access checked by Middleware).
     */
/**
 * Store a newly created resource in storage (Admin/PM access checked by Middleware).
 */
    public function store(ProjectStoreRequest $request)
    {
        $validated = $request->validated();
        
        // ✅ Auto-set created_by to the authenticated user
        $validated['created_by'] = $request->user()->id;
        
        // ✅ If manager_id is not provided, set it to the creator
        if (!isset($validated['manager_id'])) {
            $validated['manager_id'] = $request->user()->id;
        }
        
        // ✅ For Project Managers: Ensure they can only create projects they manage
        $userRole = $request->user()->roles->first()?->name;
        if (strtolower($userRole) === 'project_manager' && $validated['manager_id'] !== $request->user()->id) {
            return response()->json([
                'message' => 'Project Managers can only create projects they manage.'
            ], 403);
        }
        
        // Extract team members if provided
        $teamMembers = $validated['team_members'] ?? [];
        unset($validated['team_members']);
        
        // Create the project
        $project = Project::create($validated);
        
        // Attach team members if any were provided
        if (!empty($teamMembers)) {
            $project->teamMembers()->attach($teamMembers);
        }
        
        // Load relationships for response
        $project->load(['client', 'manager', 'teamMembers']);

        return response()->json([
            'message' => 'Project created successfully.', 
            'project' => $project
        ], 201);
    }

    /**
     * Display the specified resource (Project Details). 
     * Accessible by all authenticated users, secured by ProjectPolicy.
     */
    public function show(Project $project) // Use route model binding
    {
        // ENFORCES THE POLICY: Checks if the user is authorized to view this specific $project
        $this->authorize('view', $project);

        // If authorization passes, load relations and return the data
        return response()->json($project->load(['manager', 'members', 'tasks', 'client']));
    }

    /**
     * Update the specified resource in storage (Admin/PM access checked by Middleware).
     */
/**
 * Update the specified resource in storage (Admin/PM access checked by Middleware).
 */
    public function update(Request $request, Project $project)
    {
        // ✅ Add authorization check
        $this->authorize('update', $project);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'budget' => 'nullable|numeric|min:0',
            'status' => 'sometimes|in:active,completed,on_hold,cancelled',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'client_id' => 'nullable|exists:users,id',
            'manager_id' => 'nullable|exists:users,id',
            'team_members' => 'nullable|array',
            'team_members.*' => 'exists:users,id',
        ]);
        
        // Handle team members if provided
        if (isset($validated['team_members'])) {
            $teamMembers = $validated['team_members'];
            unset($validated['team_members']);
            $project->teamMembers()->sync($teamMembers); // Use sync to update
        }
        
        $project->update($validated); 
        $project->load(['client', 'manager', 'teamMembers']);
        
        return response()->json([
            'message' => 'Project updated successfully.',
            'project' => $project
        ]);
    }

    /**
     * Remove the specified resource from storage (Admin/PM access checked by Middleware).
     */
    public function destroy(Project $project)
    {
        // ✅ Add authorization check
        $this->authorize('delete', $project);
        
        $project->delete();
        return response()->json([
            'message' => 'Project deleted successfully.'
        ], 200); // Changed from 204 to include message
    }

    /**
     * Get detailed project information with all relationships
     */
    public function showDetails(Project $project)
    {
        // Load all necessary relationships
        $project->load([
            'client',
            'manager',
            'teamMembers',
            'tasks',
            'expenses'
        ]);

        return response()->json([
            'success' => true,
            'data' => $project
        ]);
    }
}