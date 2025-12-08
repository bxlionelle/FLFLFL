<?php

namespace App\Models;

// database/migrations/*_create_projects_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status')->default('active'); // e.g., active, on_hold, completed

            // Foreign Key for the Project Manager (used by ProjectPolicy)
            $table->foreignId('manager_id')
                  ->constrained('users') // Assumes your users table is named 'users'
                  ->cascadeOnDelete();

            // Foreign Key for the Client (used by ProjectPolicy)
            $table->foreignId('client_id') 
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->date('start_date');
            $table->date('due_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};