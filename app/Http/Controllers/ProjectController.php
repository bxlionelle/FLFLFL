<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Http\Requests\ProjectStoreRequest;
use Illuminate\Support\Facades\Gate;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $userRole = $user->roles->first()?->name;

        $query = Project::with(['client', 'manager', 'teamMembers', 'tasks.assignedUser']);

        // Role-based filtering
        switch (strtolower($userRole)) {
            case 'member':
                $query->whereHas('teamMembers', fn($q) => $q->where('user_id', $user->id));
                break;
            case 'project_manager':
                $query->where(fn($q) => $q->where('created_by', $user->id)->orWhere('manager_id', $user->id));
                break;
            case 'client':
                $query->where('client_id', $user->id);
                break;
            case 'administrator':
                // Admin sees all
                break;
            default:
                return response()->json(['data' => []]);
        }

        $projects = $query->get()->map(function ($project) use ($userRole) {
            $tasks = $project->tasks->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'status' => $task->status, // matches Angular
                    'priority' => $task->priority,
                    'progress' => $task->progress ?? 0,
                    'start_date' => $task->start_date,
                    'end_date' => $task->due_date ?? $task->end_date,
                    'assigned_user_id' => $task->assigned_user_id,
                    'assignee' => $task->assignedUser->name ?? ($task->assignedUser->firstname . ' ' . $task->assignedUser->lastname ?? 'Unassigned')
                ];
            });

            return [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'status' => $project->status,
                'progress' => $project->progress ?? 0,
                'team_size' => $project->teamMembers->count(),
                'created_by' => $project->created_by,
                'manager_id' => $project->manager_id,
                'client_id' => $project->client_id,
                'tasks' => $tasks,
                'team_members' => strtolower($userRole) !== 'client'
                    ? $project->teamMembers->map(fn($member) => [
                        'id' => $member->id,
                        'name' => $member->firstname . ' ' . $member->lastname,
                        'avatar' => strtoupper(substr($member->firstname ?? '', 0, 1) . substr($member->lastname ?? '', 0, 1))
                    ])
                    : [],
            ];
        });

        return response()->json(['data' => $projects]);
    }

    public function store(ProjectStoreRequest $request)
    {
        $validated = $request->validated();
        $validated['created_by'] = $request->user()->id;
        $validated['manager_id'] = $validated['manager_id'] ?? $request->user()->id;

        $project = Project::create($validated);
        if (!empty($validated['team_members'] ?? [])) {
            $project->teamMembers()->attach($validated['team_members']);
        }

        $project->load(['client', 'manager', 'teamMembers', 'tasks.assignedUser']);
        return response()->json(['message' => 'Project created successfully', 'project' => $project], 201);
    }

    public function show(Project $project)
    {
        Gate::authorize('view', $project);
        $project->load(['manager', 'teamMembers', 'tasks.assignedUser', 'client']);
        return response()->json($project);
    }

    public function update(Request $request, Project $project)
    {
        Gate::authorize('update', $project);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:active,completed,on_hold,cancelled',
            'progress' => 'sometimes|integer|min:0|max:100',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'client_id' => 'nullable|exists:users,id',
            'manager_id' => 'nullable|exists:users,id',
            'team_members' => 'nullable|array',
            'team_members.*' => 'exists:users,id',
        ]);

        if (isset($validated['team_members'])) {
            $project->teamMembers()->sync($validated['team_members']);
            unset($validated['team_members']);
        }

        $project->update($validated);
        $project->load(['client', 'manager', 'teamMembers', 'tasks.assignedUser']);

        return response()->json(['message' => 'Project updated successfully', 'project' => $project]);
    }

    public function destroy(Project $project)
    {
        Gate::authorize('delete', $project);
        $project->delete();
        return response()->json(['message' => 'Project deleted successfully']);
    }

    public function showDetails(Project $project)
    {
        Gate::authorize('view', $project);
        $project->load(['client', 'manager', 'teamMembers', 'tasks.assignedUser', 'expenses']);
        return response()->json(['success' => true, 'data' => $project]);
    }
}
