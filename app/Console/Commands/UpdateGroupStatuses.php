<?php

namespace App\Console\Commands;

use App\Models\Group;
use App\Models\Comment;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class UpdateGroupStatuses extends Command
{
    protected $signature = 'groups:update-statuses 
                            {--chunk=1000 : Process groups in chunks for better performance}
                            {--dry-run : Show what would be updated without saving}';
    
    protected $description = 'Update group statuses based on comments';

    public function handle()
    {
        $this->info('Starting to update group statuses...');
        $dryRun = $this->option('dry-run');
        $chunkSize = (int) $this->option('chunk');
        
        if ($dryRun) {
            $this->warn('DRY RUN MODE - No changes will be saved');
        }

        $totalUpdated = 0;
        $totalProcessed = 0;

        // Process ALL groups in chunks
        Group::chunkById($chunkSize, function ($groups) use ($dryRun, &$totalUpdated, &$totalProcessed) {
            foreach ($groups as $group) {
                $totalProcessed++;
                
                // Count comments with content for this group
                $commentsCount = Comment::where('group_id', $group->group_id)
                    ->whereNotNull('comment')
                    ->where('comment', '!=', '')
                    ->count();
                
                // Count total comments for this group
                $totalComments = Comment::where('group_id', $group->group_id)->count();
                
                $originalStatus = $group->status;

                // Determine new status
                if ($totalComments === 0) {
                    $newStatus = 'pending';
                } elseif ($commentsCount === $totalComments && $totalComments > 0) {
                    $newStatus = 'completed';
                } elseif ($commentsCount > 0) {
                    $newStatus = 'in-progress';
                } else {
                    $newStatus = 'pending';
                }

                // Only update if status changed
                if ($originalStatus !== $newStatus) {
                    if (!$dryRun) {
                        $group->status = $newStatus;
                        $group->save();
                    }
                    
                    $totalUpdated++;
                    
                    $this->line("Group #{$group->group_id} ({$group->group_name}): {$originalStatus} → {$newStatus} " . 
                                "({$commentsCount}/{$totalComments} comments)");
                } else {
                    // Show even if not updated for debugging
                    $this->debug("Group #{$group->group_id} ({$group->group_name}): No change [{$originalStatus}] " . 
                                "({$commentsCount}/{$totalComments} comments)");
                }
            }
            
            $this->info("Processed chunk: {$totalProcessed} groups so far, {$totalUpdated} updated");
        });

        $this->info("\n" . str_repeat('=', 50));
        
        if ($dryRun) {
            $this->warn("DRY RUN SUMMARY:");
            $this->info("Processed {$totalProcessed} groups");
            $this->info("Would update {$totalUpdated} groups");
        } else {
            $this->info("✅ STATUS UPDATE COMPLETED!");
            $this->info("Processed {$totalProcessed} groups");
            $this->info("Updated {$totalUpdated} groups");
            
            Log::info('Group statuses updated', [
                'total_processed' => $totalProcessed,
                'total_updated' => $totalUpdated
            ]);
        }

        return Command::SUCCESS;
    }
    
    private function debug($message)
    {
        if ($this->option('verbose')) {
            $this->line($message, 'comment');
        }
    }
}