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

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'store']); 
Route::get('/csrf-cookie', function() {
    return response()->json(['message' => 'CSRF cookie set']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'destroy']);
    Route::get('/dashboard', [DashboardController::class, 'summary']);
    
    // ✅ All authenticated users can view projects (filtered by role in controller)
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::get('/projects/{project}', [ProjectController::class, 'show']); // Use policy for authorization
    Route::get('/projects/{project}/details', [ProjectController::class, 'showDetails']);
    
    Route::put('/user/profile', [UserController::class, 'updateProfile']);
});

Route::middleware(['auth:sanctum', 'role:administrator'])->group(function () {
    Route::get('users/count/total', [UserController::class, 'getUserCount']);
    Route::apiResource('users', UserController::class); 
    
    Route::get('/roles', [RolesController::class, 'getRoles']);
    Route::post('/create-roles', [RolesController::class, 'createRole']);
});

Route::middleware(['auth:sanctum', 'role:administrator,project_manager'])->group(function () {
    // Only PM and Admin can create/update/delete projects
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::put('/projects/{project}', [ProjectController::class, 'update']);
    Route::delete('/projects/{project}', [ProjectController::class, 'destroy']);
    
    Route::apiResource('teams', TeamController::class); 
});

Route::middleware(['auth:sanctum', 'role:administrator,project_manager,member'])->group(function () {
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('expenses', ExpenseController::class);
});

Route::middleware(['auth:sanctum', 'role:administrator,client'])->group(function () {
    Route::apiResource('feedback', FeedbackController::class);
});