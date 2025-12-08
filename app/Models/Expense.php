<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model // <-- MUST be the Model class
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'project_id', 'amount', 'description', 'status'
    ];

    // Define relationships (e.g., user, project)
    public function user() {
        return $this->belongsTo(User::class);
    }

    public function project() {
        return $this->belongsTo(Project::class);
    }
}