<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request)
    {
        $userId = $request->user()->id;
        $userRole = $request->user()->role->name; // Assuming 'role' relationship

        // This data fetching must be dynamically filtered by the user's role/ID.
        $activeProjects = Project::query()
            ->when($userRole === 'project_manager', function ($query) use ($userId) {
                return $query->where('manager_id', $userId);
            })
            ->when($userRole === 'member', function ($query) use ($userId) {
                return $query->whereHas('members', fn($q) => $q->where('user_id', $userId));
            })
            ->where('status', 'active')
            ->count();

        $tasksDone = Task::where('assigned_user_id', $userId)
            ->where('status', 'done')
            ->count();

        return response()->json([
            'active_projects' => $activeProjects,
            'tasks_done' => $tasksDone,
            // ... other dashboard metrics
        ]);
    }
    
}
