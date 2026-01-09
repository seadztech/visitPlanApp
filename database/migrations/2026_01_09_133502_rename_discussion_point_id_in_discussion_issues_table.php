<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('discussion_issues', function (Blueprint $table) {
            $table->renameColumn('discussion_point_id', 'comment_id');
        });
    }

    public function down(): void
    {
        Schema::table('discussion_issues', function (Blueprint $table) {
            $table->renameColumn('comment_id', 'discussion_point_id');
        });
    }
};
