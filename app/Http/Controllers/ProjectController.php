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
        $userRole = $user->role->name;

        $projects = Project::query();

        // PMs only see projects they manage
        if ($userRole === 'project_manager') {
            $projects->where('manager_id', $user->id);
        }
        // Admins see everything (no 'where' clause needed)

        return response()->json($projects->with('manager', 'client')->get());
    }

    /**
     * Store a newly created resource in storage (Admin/PM access checked by Middleware).
     */
    public function store(ProjectStoreRequest $request)
    {
        // ASSUMPTION: Validation is handled by ProjectStoreRequest
        $project = Project::create($request->validated());

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
    public function update(Request $request, Project $project)
    {
        // You would typically use a Policy here too: $this->authorize('update', $project);
        
        $project->update($request->all()); 
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
        // You would typically use a Policy here too: $this->authorize('delete', $project);
        
        $project->delete();
        return response()->json(null, 204);
    }
}