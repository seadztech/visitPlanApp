<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SetupDiscussionPoints extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'discussion:setup
                            {--test : Test mode, don\'t save}
                            {--migrate : Migrate discussion points from objectives}
                            {--fill-comments : Fill comments for all groups}';

    /**
     * The console command description.
     */
    protected $description = 'Setup discussion points and comments';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $testMode = $this->option('test');
        $migrate = $this->option('migrate');
        $fillComments = $this->option('fill-comments');
        
        if ($migrate) {
            return $this->migrateDiscussionPoints($testMode);
        }
        
        if ($fillComments) {
            return $this->fillCommentsForGroups($testMode);
        }
        
        // Show help
        $this->info('Discussion Points Setup');
        $this->info('=======================');
        $this->newLine();
        $this->info('Run in this order:');
        $this->info('  1. php artisan discussion:setup --migrate --test');
        $this->info('  2. php artisan discussion:setup --migrate');
        $this->info('  3. php artisan discussion:setup --fill-comments --test');
        $this->info('  4. php artisan discussion:setup --fill-comments');
        
        return 0;
    }
    
    /**
     * STEP 1: Migrate discussion points directly from objectives table
     */
    private function migrateDiscussionPoints(bool $testMode): int
    {
        $this->info('Migrating discussion points from objectives...');
        
        // Clear existing data if not test mode
        if (!$testMode) {
            DB::table('discussion_points')->truncate();
        }
        
        // Get ALL objectives
        $objectives = DB::table('objectives')->get();
        
        if ($objectives->isEmpty()) {
            $this->error('❌ No objectives found');
            return 1;
        }
        
        $this->info("Found {$objectives->count()} objectives");
        
        $totalPointsCreated = 0;
        
        $progressBar = $this->output->createProgressBar($objectives->count());
        $progressBar->start();
        
        foreach ($objectives as $objective) {
            try {
                // Get discussion points from JSON
                $discussionPoints = json_decode($objective->discussion_points, true);
                
                if (!is_array($discussionPoints) || empty($discussionPoints)) {
                    $this->warn("Objective {$objective->id}: No discussion points found");
                    $progressBar->advance();
                    continue;
                }
                
                $pointsForObjective = 0;
                
                foreach ($discussionPoints as $point) {
                    if (empty(trim($point))) {
                        continue;
                    }
                    
                    $pointData = [
                        'objective_id' => $objective->id,
                        'point' => trim($point),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                    
                    if (!$testMode) {
                        DB::table('discussion_points')->insert($pointData);
                    }
                    
                    $pointsForObjective++;
                    $totalPointsCreated++;
                }
                
                if ($testMode) {
                    $this->info("  Objective {$objective->id}: Would create {$pointsForObjective} discussion points");
                }
                
            } catch (\Exception $e) {
                $this->error("Error processing objective {$objective->id}: " . $e->getMessage());
            }
            
            $progressBar->advance();
        }
        
        $progressBar->finish();
        
        $this->newLine();
        $this->info("✅ Total discussion points: {$totalPointsCreated}");
        
        if ($testMode) {
            $this->warn('⚠️  TEST MODE: No changes made');
        } else {
            $this->info("📊 Discussion points in database: " . DB::table('discussion_points')->count());
        }
        
        return 0;
    }
    
    /**
     * STEP 2: Fill comments for ALL groups
     * Creates comments for EACH discussion point for EACH group
     */
    private function fillCommentsForGroups(bool $testMode): int
    {
        $this->info('Filling comments for all groups...');
        
        // Get ALL groups
        $groups = DB::table('groups')->get();
        
        if ($groups->isEmpty()) {
            $this->error('❌ No groups found');
            return 1;
        }
        
        $this->info("Found {$groups->count()} groups");
        
        // Get ALL discussion points
        $discussionPoints = DB::table('discussion_points')->get();
        
        if ($discussionPoints->isEmpty()) {
            $this->error('❌ No discussion points found');
            $this->info('Run --migrate first: php artisan discussion:setup --migrate');
            return 1;
        }
        
        $this->info("Found {$discussionPoints->count()} discussion points");
        
        // Calculate total possible comments
        $totalPossible = $groups->count() * $discussionPoints->count();
        $this->info("📊 Total possible comments: {$totalPossible}");
        
        $totalCommentsCreated = 0;
        $totalSkipped = 0;
        
        $progressBar = $this->output->createProgressBar($discussionPoints->count());
        $progressBar->start();
        
        // For EACH discussion point
        foreach ($discussionPoints as $point) {
            try {
                // For EACH group
                foreach ($groups as $group) {
                    // Check if comment already exists for this group and discussion point
                    $exists = DB::table('comments')
                        ->where('group_id', $group->group_id)
                        ->where('discussion_point_id', $point->id)
                        ->exists();
                    
                    if ($exists) {
                        $totalSkipped++;
                        continue;
                    }
                    
                    // Get the objective for this discussion point
                    $objective = DB::table('objectives')
                        ->where('id', $point->objective_id)
                        ->first();
                    
                    // Create comment with discussion_point_id
                    $commentData = [
                        'discussion_point_id' => $point->id,
                        'objective_id' => $point->objective_id, // Keep for reference
                        'group_id' => $group->group_id,
                        'comment' => '', // Empty for user to fill
                        'issues_raised' => '', // Empty for user to fill
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                    
                    if (!$testMode) {
                        DB::table('comments')->insert($commentData);
                    }
                    
                    $totalCommentsCreated++;
                }
                
            } catch (\Exception $e) {
                $this->error("Error for discussion point {$point->id}: " . $e->getMessage());
            }
            
            $progressBar->advance();
        }
        
        $progressBar->finish();
        
        $this->newLine();
        $this->info("✅ New comments created: {$totalCommentsCreated}");
        $this->info("⏭️  Comments skipped (already exist): {$totalSkipped}");
        
        if ($testMode) {
            $this->warn('⚠️  TEST MODE: No changes made');
        } else {
            $totalAllComments = DB::table('comments')->count();
            $this->info("📊 Total comments in database: {$totalAllComments}");
            
            // Show sample
            $sample = DB::table('comments as c')
                ->join('groups as g', 'c.group_id', '=', 'g.group_id')
                ->join('discussion_points as dp', 'c.discussion_point_id', '=', 'dp.id')
                ->join('objectives as o', 'dp.objective_id', '=', 'o.id')
                ->select('c.id', 'g.group_name', 'o.objective', 'dp.point')
                ->orderBy('c.id', 'desc')
                ->take(3)
                ->get();
            
            if ($sample->isNotEmpty()) {
                $this->newLine();
                $this->info('📋 Sample of created comments:');
                foreach ($sample as $item) {
                    $this->info("  • Group: {$item->group_name}");
                    $this->info("    Objective: {$item->objective}");
                    $this->info("    Discussion Point: " . substr($item->point, 0, 40) . "...");
                }
            }
        }
        
        return 0;
    }
}