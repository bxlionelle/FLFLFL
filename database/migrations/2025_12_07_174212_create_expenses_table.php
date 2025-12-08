<?php

// database/migrations/*_create_expenses_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('description');
            $table->decimal('amount', 8, 2);
            $table->string('status')->default('pending'); // pending, approved, rejected

            // Who submitted the expense (used for Member filtering)
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            // Which project the expense is for (used for PM filtering)
            $table->foreignId('project_id')
                  ->constrained('projects')
                  ->cascadeOnDelete();
                  
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};