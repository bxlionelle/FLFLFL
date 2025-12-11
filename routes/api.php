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
    Route::get('/project-details/{project}', [ProjectController::class, 'showDetails']);
    
    // User profile update - accessible to all authenticated users
    Route::put('/user/profile', [UserController::class, 'updateProfile']);
});

Route::middleware(['auth:sanctum', 'role:administrator'])->group(function () {

    Route::get('users/count/total', [UserController::class, 'getUserCount']);
    Route::apiResource('users', UserController::class); 
    
    Route::get('/roles', [RolesController::class, 'getRoles']);
    Route::post('/create-roles', [RolesController::class, 'createRole']);
});

Route::middleware(['auth:sanctum', 'role:administrator,project_manager'])->group(function () {
    Route::apiResource('projects', ProjectController::class)->except(['show']);
    Route::apiResource('teams', TeamController::class); 
});

Route::middleware(['auth:sanctum', 'role:administrator,project_manager,member'])->group(function () {
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('expenses', ExpenseController::class);
});

Route::middleware(['auth:sanctum', 'role:administrator,client'])->group(function () {
    Route::apiResource('feedback', FeedbackController::class);
});