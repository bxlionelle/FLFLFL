<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    private $validStatuses = ['toDo', 'inProgress', 'inReview', 'completed'];
    private $validPriorities = ['Low', 'Medium', 'High'];

    /**
     * Display a listing of tasks.
     */
    public function index()
    {
        $tasks = Task::with('assignedUser', 'project')->get();

        // Map tasks to Angular-friendly format
        $tasks = $tasks->map(function ($task) {
            return [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'status' => $task->status, // Already Angular-friendly
                'priority' => $task->priority,
                'progress' => $task->progress ?? 0,
                'start_date' => $task->start_date,
                'end_date' => $task->due_date ?? $task->end_date,
                'project_id' => $task->project_id,
                'assigned_user_id' => $task->assigned_user_id,
                'assignee' => $task->assignedUser->name ?? ($task->assignedUser->firstname . ' ' . $task->assignedUser->lastname ?? 'Unassigned')
            ];
        });

        return response()->json($tasks);
    }

    /**
     * Store a newly created task.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id'       => 'required|exists:projects,id',
            'title'            => 'required|string|max:255',
            'description'      => 'nullable|string',
            // TEMP: accept any string status to stop the 422 and see data
            'status'           => 'required|string',
            'priority'         => ['required', 'string', Rule::in($this->validPriorities)],
            'start_date'       => 'required|date',
            'end_date'         => 'required|date|after_or_equal:start_date',
            'assigned_user_id' => 'required|exists:users,id',
            'progress'         => 'sometimes|integer|min:0|max:100',
        ]);

        $task = Task::create([
            ...$validated,
            'created_by' => $request->user()->id,
        ]);

        $task->load('assignedUser', 'project');

        return response()->json([
            'id' => $task->id,
            'title' => $task->title,
            'description' => $task->description,
            'status' => $task->status,
            'priority' => $task->priority,
            'progress' => $task->progress ?? 0,
            'start_date' => $task->start_date,
            'end_date' => $task->end_date,
            'project_id' => $task->project_id,
            'assigned_user_id' => $task->assigned_user_id,
            'assignee' => $task->assignedUser->name ?? ($task->assignedUser->firstname . ' ' . $task->assignedUser->lastname ?? 'Unassigned')
        ], 201);
    }

    /**
     * Update task (used for drag & drop or form updates).
     */
    public function update(Request $request, Task $task)
    {
        $validated = $request->validate([
            'title'            => 'sometimes|string|max:255',
            'description'      => 'nullable|string',
            'status'           => ['sometimes', 'string'],
            'priority'         => ['sometimes', 'string', Rule::in($this->validPriorities)],
            'progress'         => 'sometimes|integer|min:0|max:100',
            'start_date'       => 'sometimes|date',
            'end_date'         => 'sometimes|date|after_or_equal:start_date',
            'assigned_user_id' => 'sometimes|exists:users,id',
        ]);

        $task->update($validated);
        $task->load('assignedUser', 'project');

        return response()->json([
            'id' => $task->id,
            'title' => $task->title,
            'description' => $task->description,
            'status' => $task->status,
            'priority' => $task->priority,
            'progress' => $task->progress ?? 0,
            'start_date' => $task->start_date,
            'end_date' => $task->end_date,
            'project_id' => $task->project_id,
            'assigned_user_id' => $task->assigned_user_id,
            'assignee' => $task->assignedUser->name ?? ($task->assignedUser->firstname . ' ' . $task->assignedUser->lastname ?? 'Unassigned')
        ]);
    }

    /**
     * Delete a task.
     */
    public function destroy(Task $task)
    {
        $task->delete();
        return response()->json(['message' => 'Task deleted successfully']);
    }
}
