<?php

use Illuminate\Http\Request;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\RolesController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProjectController; 
use App\Http\Controllers\TaskController; 
use App\Http\Controllers\ExpenseController; 
use App\Http\Controllers\TeamController; 
use App\Http\Controllers\DashboardController; 
use App\Http\Controllers\FeedbackController; 
use Illuminate\Support\Facades\Route;

// ===================================
// PUBLIC ROUTES
// ===================================
// Allows unauthenticated users to log in or register (if allowed)
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'store']); // Assuming registration is open or used for quick setup

// ===================================
// AUTHENTICATED ROUTES (ANY LOGGED-IN USER)
// ===================================
Route::middleware('auth:sanctum')->group(function () {
    // Basic Auth Operations
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'destroy']);
    
    // Dashboard Summary (Basic data for all roles)
    Route::get('/dashboard', [DashboardController::class, 'summary']);
    
    // Project Details (Assuming any logged-in user can view details for their assigned project)
    // Policy checks would be used here to ensure they only view THEIR projects.
    Route::get('/project-details/{project}', [ProjectController::class, 'showDetails']);
});

// ----------------------------------------------------
// ADMINISTRATOR ROUTES (Admin Only)
// ----------------------------------------------------
// Only users with the 'administrator' role can access these routes
Route::middleware(['auth:sanctum', 'role:administrator'])->group(function () {
    
    // Full User & Role Management
    Route::apiResource('users', UserController::class); 
    Route::get('users/count/total', [UserController::class, 'getUserCount']);
    
    Route::get('/roles', [RolesController::class, 'getRoles']);
    Route::post('/create-roles', [RolesController::class, 'createRole']);
    // Note: Creating/managing permissions would also go here.
});

// ----------------------------------------------------
// PROJECT MANAGER ROUTES (Admin OR Project Manager)
// ----------------------------------------------------
// Access for Project Management and Team Management features
Route::middleware(['auth:sanctum', 'role:administrator,project_manager'])->group(function () {
    
    // Project Management (CRUD for projects)
    Route::apiResource('projects', ProjectController::class)->except(['show']); // show is handled generically above
    
    // Team Management (Viewing/assigning teams)
    Route::apiResource('teams', TeamController::class); 
});


// ----------------------------------------------------
// TEAM ACCESS ROUTES (Admin, PM, OR Member)
// ----------------------------------------------------
// Access for operational features like tasks and expenses
Route::middleware(['auth:sanctum', 'role:administrator,project_manager,member'])->group(function () {
    
    // Tasks (Team members need to view and update their assigned tasks)
    Route::apiResource('tasks', TaskController::class);
    
    // Expenses (Team members need to submit and view their own expenses)
    Route::apiResource('expenses', ExpenseController::class);
});

// ----------------------------------------------------
// CLIENT ACCESS ROUTES (Admin OR Client)
// ----------------------------------------------------
// Access for client-specific features
Route::middleware(['auth:sanctum', 'role:administrator,client'])->group(function () {
    
    // Feedback submission/viewing
    Route::apiResource('feedback', FeedbackController::class);
});