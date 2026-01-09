<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class GroupComments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'comments:fill-all
                            {--test : Test mode, don\'t save}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fill comments for ALL objectives and ALL groups';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $testMode = $this->option('test');
        
        $this->info('==========================================');
        $this->info('   FILLING COMMENTS FOR ALL GROUPS');
        $this->info('==========================================');
        
        // Get ALL objectives
        $objectives = DB::table('objectives')->get();
        
        if ($objectives->isEmpty()) {
            $this->error('❌ No objectives found in database');
            $this->info('   Check your objectives table');
            return 1;
        }
        
        $this->info("📋 Found {$objectives->count()} objective(s)");
        
        // Get ALL groups
        $groups = DB::table('groups')->get();
        
        if ($groups->isEmpty()) {
            $this->error('❌ No groups found in database');
            $this->info('   Make sure groups are imported first');
            return 1;
        }
        
        $this->info("👥 Found {$groups->count()} group(s)");
        
        // Calculate total
        $totalPossible = $groups->count() * $objectives->count();
        $this->info("📊 Total possible comments: {$totalPossible}");
        
        if ($testMode) {
            $this->warn('🔍 TEST MODE: No changes will be saved');
        }
        
        $this->newLine();
        $this->info('🔄 Processing...');
        
        $createdCount = 0;
        $skippedCount = 0;
        
        $progressBar = $this->output->createProgressBar($objectives->count());
        $progressBar->start();
        
        // For EACH objective
        foreach ($objectives as $objective) {
            // For EACH group
            foreach ($groups as $group) {
                // Check if already exists
                $exists = DB::table('comments')
                    ->where('group_id', $group->group_id)
                    ->where('objective_id', $objective->id)
                    ->exists();
                
                if ($exists) {
                    $skippedCount++;
                    continue;
                }
                
                // Create the comment
                $commentData = [
                    'objective_id' => $objective->id,
                    'group_id' => $group->group_id,
                    'comment' => '',
                    'issues_raised' => '',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                
                if (!$testMode) {
                    DB::table('comments')->insert($commentData);
                }
                
                $createdCount++;
            }
            
            $progressBar->advance();
        }
        
        $progressBar->finish();
        
        // Show results
        $this->newLine(2);
        $this->info('==========================================');
        $this->info('              RESULTS');
        $this->info('==========================================');
        
        $this->info("✅ New comments to create: {$createdCount}");
        $this->info("⏭️  Already exist (skipped): {$skippedCount}");
        $this->info("📊 Total processed: " . ($createdCount + $skippedCount));
        
        if ($testMode) {
            $this->newLine();
            $this->warn('⚠️  TEST MODE: No comments were actually created');
            $this->info('   To create comments, run without --test flag');
        } else {
            $this->newLine();
            $this->info('🎉 Successfully created all comments!');
            
            // Show final count
            $totalComments = DB::table('comments')->count();
            $this->info("📈 Total comments in database: {$totalComments}");
        }
        
        return 0;
    }
}