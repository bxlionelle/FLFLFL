<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Project;
use Illuminate\Auth\Access\Response;

class ProjectPolicy
{
    /**
     * Determine access for all abilities. Allows the Administrator to bypass checks.
     */
    public function before(User $user, string $ability): bool|null
    {
        // Check if the user is an Administrator
        if ($user->role->name === 'administrator') {
            return true;
        }
        return null; // Continue with specific checks
    }

    /**
     * Determine whether the user can view the project details.
     * This is used by the GET /api/project-details/{project} endpoint.
     */
    public function view(User $user, Project $project): Response
    {
        $userRole = $user->role->name;

        // 1. Project Manager: Can view any project they manage.
        if ($userRole === 'project_manager' && $project->manager_id === $user->id) {
            return Response::allow();
        }

        // 2. Member: Can view projects they are assigned to.
        // ASSUMPTION: Project model has a 'members' many-to-many relationship
        if ($userRole === 'member' && $project->members()->where('user_id', $user->id)->exists()) {
            return Response::allow();
        }

        // 3. Client: Can view projects they are associated with.
        // ASSUMPTION: Project model has a 'client_id' foreign key.
        if ($userRole === 'client' && $project->client_id === $user->id) {
            return Response::allow();
        }

        return Response::deny('You are not authorized to view the details of this project.');
    }

    /**
     * Determine whether the user can create projects.
     * The route middleware (role:administrator,project_manager) already restricts this.
     * This can be used for double-checking authorization within a form request.
     */
    public function create(User $user): Response
    {
        // This is implicitly restricted by route middleware.
        if ($user->role->name === 'project_manager') {
            return Response::allow();
        }

        return Response::deny('Only Project Managers and Administrators can create projects.');
    }

    /**
     * Determine whether the user can update the project.
     */
    public function update(User $user, Project $project): Response
    {
        // Only the assigned Project Manager can update the project details (excluding Admin via before()).
        if ($project->manager_id === $user->id) {
            return Response::allow();
        }

        return Response::deny('You do not have management privileges for this project.');
    }

    /**
     * Determine whether the user can delete the project.
     */
    public function delete(User $user, Project $project): Response
    {
        // Only the assigned Project Manager can delete the project.
        if ($project->manager_id === $user->id) {
            return Response::allow();
        }

        return Response::deny('You do not have permission to delete this project.');
    }
}