<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'status',
        'progress',
        'manager_id',
        'client_id',
        'created_by',
        'start_date',
        'end_date',
        'due_date',
        'budget',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'due_date' => 'date',
        'progress' => 'integer',
    ];

    /**
     * Get the client associated with the project
     */
    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    /**
     * Get the project manager
     */
    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    /**
     * Get the user who created the project
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get all team members assigned to the project
     */
    public function teamMembers()
    {
        return $this->belongsToMany(User::class, 'project_user', 'project_id', 'user_id')
                    ->withTimestamps();
    }

    /**
     * Alias for teamMembers (for compatibility)
     */
    public function members()
    {
        return $this->teamMembers();
    }

    /**
     * Get all tasks associated with the project
     */
    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Get all expenses associated with the project
     */
    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    /**
     * Scope to filter active projects
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to filter completed projects
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Check if user is a team member of this project
     */
    public function hasTeamMember($userId)
    {
        return $this->teamMembers()->where('user_id', $userId)->exists();
    }
}