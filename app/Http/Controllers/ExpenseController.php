<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Expense; // Assumed Expense Model exists
use App\Models\Project; // Needed to filter projects by manager
use Illuminate\Support\Facades\DB;
use App\Http\Requests\ExpenseStoreRequest; // Assume Form Request for validation
// If you implement policies, you would also use the appropriate policy here

class ExpenseController extends Controller
{
    /**
     * Display a listing of expenses, filtered by user role.
     * Accessible by Admin, Project Manager, and Member.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $userRole = $user->role->name; // Assuming 'role' relationship exists

        $expenses = Expense::query();
        
        // Eager load necessary relationships for the response
        $expenses->with(['user', 'project']);

        // --- Role-Based Data Filtering ---
        if ($userRole === 'member') {
            // Members see only their own submitted expenses
            $expenses->where('user_id', $user->id);
            
        } elseif ($userRole === 'project_manager') {
            // Project Managers see expenses related to projects they manage.
            
            // 1. Get the IDs of projects managed by the current PM
            $managedProjectIds = Project::where('manager_id', $user->id)->pluck('id');
            
            // 2. Filter expenses to those project IDs
            $expenses->whereIn('project_id', $managedProjectIds);
            
        } 
        // Admin sees all expenses (no filter needed)

        return response()->json($expenses->latest()->get());
    }

    /**
     * Store a newly created expense (Accessible by Admin, PM, and Member).
     */
    public function store(ExpenseStoreRequest $request)
    {
        // ASSUMPTION: The incoming request includes 'project_id' and 'amount'
        $expense = Expense::create([
            'user_id' => $request->user()->id, // Automatically assign the logged-in user
            'project_id' => $request->input('project_id'),
            'amount' => $request->input('amount'),
            'description' => $request->input('description'),
            'status' => 'pending', // New expenses are pending by default
        ]);

        return response()->json([
            'message' => 'Expense submitted for approval.',
            'expense' => $expense
        ], 201);
    }

    /**
     * Display the specified expense resource.
     * Note: A Policy should be implemented to ensure the user can view this specific expense.
     */
    public function show(Expense $expense) // Using route model binding
    {
        // Policy Check: $this->authorize('view', $expense);
        
        return response()->json($expense->load(['user', 'project']));
    }

    /**
     * Update the specified expense resource.
     * This is typically used for approval/rejection or editing own expense before approval.
     */
    public function update(Request $request, Expense $expense)
    {
        // Policy Check: $this->authorize('update', $expense);
        
        // --- Example: Approval/Status Change Logic ---
        $user = $request->user();
        
        if ($request->has('status') && $user->role->name === 'project_manager') {
             // PMs can only approve/reject if the project is theirs.
             if ($expense->project->manager_id === $user->id) {
                 $expense->update(['status' => $request->input('status')]);
                 return response()->json(['message' => "Expense status updated to {$expense->status}."], 200);
             }
        }
        
        // Members might be able to update description/amount IF status is 'pending'
        if ($expense->user_id === $user->id && $expense->status === 'pending') {
             $expense->update($request->only(['description', 'amount']));
             return response()->json(['message' => 'Expense updated.'], 200);
        }

        return response()->json(['message' => 'Unauthorized or invalid action.'], 403);
    }

    /**
     * Remove the specified expense resource from storage.
     */
    public function destroy(Expense $expense)
    {
        // Policy Check: $this->authorize('delete', $expense);
        
        $expense->delete();
        return response()->json(null, 204);
    }
    
}