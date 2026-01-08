<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Outpost;
use App\Models\Group;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class CreateGroups extends Command
{
    protected $signature = 'create:groups {file} {--truncate} {--test} {--debug}';
    protected $description = 'Import groups from Excel file';

    public function handle()
    {
        $filePath = $this->argument('file');
        $truncate = $this->option('truncate');
        $testMode = $this->option('test');
        $debug = $this->option('debug');
        
        if (!file_exists($filePath)) {
            $this->error("❌ File not found: {$filePath}");
            return 1;
        }
        
        $this->info("📁 Importing from: " . basename($filePath));
        
        try {
            // Read the Excel file
            $data = Excel::toArray([], $filePath);
            
            if (empty($data[0])) {
                $this->error("❌ No data in file");
                return 1;
            }
            
            $sheet = $data[0];
            $headers = $sheet[0];
            
            if ($debug) {
                $this->info("\n📋 Excel Headers:");
                foreach ($headers as $i => $header) {
                    $this->info("  [{$i}] '{$header}'");
                }
            }
            
            // Dynamically map columns based on header names
            $columnIndexes = $this->mapColumns($headers, $debug);
            
            // Check required columns
            if (!isset($columnIndexes['BranchID'])) {
                $this->error("❌ 'BranchID' column not found in Excel!");
                return 1;
            }
            
            if (!isset($columnIndexes['Group Name'])) {
                $this->error("❌ 'Group Name' column not found in Excel!");
                return 1;
            }
            
            // Truncate if requested
            if ($truncate && !$testMode) {
                $this->warn('🗑️  Truncating groups table...');
                DB::table('groups')->truncate();
                $this->info('✅ Table truncated.');
            }
            
            // Process data
            $totalRows = count($sheet) - 1;
            $processed = 0;
            $skipped = 0;
            $errors = 0;
            
            $this->info("\n🔄 Processing {$totalRows} rows...");
            $bar = $this->output->createProgressBar($totalRows);
            $bar->start();
            
            // Get all outposts to map branch_id to outpost_id
            $outposts = Outpost::all()->keyBy('branch_code');
            
            for ($i = 1; $i < count($sheet); $i++) {
                $row = $sheet[$i];
                $rowNum = $i + 1;
                
                try {
                    // Extract values using dynamic column mapping
                    $branchId = $this->getCellValue($row, $columnIndexes, 'BranchID');
                    $groupName = $this->getCellValue($row, $columnIndexes, 'Group Name');
                    
                    if (empty($branchId) || empty($groupName)) {
                        $skipped++;
                        if ($debug && $skipped <= 3) {
                            $this->warn("\n⚠️ Row {$rowNum} skipped - missing BranchID or Group Name");
                        }
                        $bar->advance();
                        continue;
                    }
                    
                    // Clean branch ID
                    $branchId = $this->cleanBranchCode($branchId);
                    
                    // Find outpost by branch_id
                    $outpost = $outposts->get($branchId);
                    
                    if (!$outpost) {
                        $skipped++;
                        if ($debug && $skipped <= 3) {
                            $this->warn("\n⚠️ Row {$rowNum} skipped - no outpost found for branch '{$branchId}'");
                        }
                        $bar->advance();
                        continue;
                    }
                    
                    // Prepare data using dynamic column mapping
                    $groupData = [
                        'outpost_id' => $outpost->id,
                        'branch_id' => $branchId,
                        'village' => $this->getCellValue($row, $columnIndexes, 'Village'),
                        'credit_officer_id' => $this->getCellValue($row, $columnIndexes, 'Credit Officer ID') ?: 'UNKNOWN',
                        'group_id' => $this->getCellValue($row, $columnIndexes, 'Group ID'),
                        'group_name' => $groupName,
                        'group_product_id' => $this->getCellValue($row, $columnIndexes, 'Group Product ID'),
                        'savings_balance_b4' => $this->parseNumber($this->getCellValue($row, $columnIndexes, 'Savings Balance B4')),
                        'savings_balance_after' => $this->parseNumber($this->getCellValue($row, $columnIndexes, 'Savings Balance After')),
                        'loan_balance_b4' => $this->parseNumber($this->getCellValue($row, $columnIndexes, 'Loan balance b4')),
                        'loan_balance_after' => $this->parseNumber($this->getCellValue($row, $columnIndexes, 'Loan balance after')),
                        'arrears_b4' => $this->parseNumber($this->getCellValue($row, $columnIndexes, 'Arrears B4')),
                        'arrears_after' => $this->parseNumber($this->getCellValue($row, $columnIndexes, 'Arrears after')),
                        'accts_b4' => intval($this->getCellValue($row, $columnIndexes, 'Accts B4') ?: 0),
                        'accts_after' => intval($this->getCellValue($row, $columnIndexes, 'Accts after') ?: 0),
                        'venue' => $this->getCellValue($row, $columnIndexes, 'Venue'),
                        'frequency' => $this->getCellValue($row, $columnIndexes, 'Frequency'),
                        'meeting_day' => $this->getCellValue($row, $columnIndexes, 'Meeting Day'),
                        'time' => $this->parseTime($this->getCellValue($row, $columnIndexes, 'Time')),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                    
                    if ($debug && $processed < 3) {
                        $this->info("\n📊 Row {$rowNum} Data:");
                        $this->info("  Branch: '{$branchId}' → Outpost ID: {$outpost->id}");
                        $this->info("  Group: '{$groupName}'");
                        $this->info("  Savings After: " . $groupData['savings_balance_after']);
                        $this->info("  Loan B4: " . $groupData['loan_balance_b4']);
                        $this->info("  Loan After: " . $groupData['loan_balance_after']);
                        $this->info("  Arrears B4: " . $groupData['arrears_b4']);
                        $this->info("  Arrears After: " . $groupData['arrears_after']);
                    }
                    
                    if (!$testMode) {
                        try {
                            // Save to database
                            if (!empty($groupData['group_id'])) {
                                Group::updateOrCreate(
                                    ['group_id' => $groupData['group_id']],
                                    $groupData
                                );
                            } else {
                                Group::create($groupData);
                            }
                            $processed++;
                        } catch (\Exception $e) {
                            $errors++;
                            if ($debug && $errors <= 3) {
                                $this->error("\n❌ Database error row {$rowNum}: " . $e->getMessage());
                            }
                        }
                    } else {
                        $processed++;
                        if ($debug && $processed <= 3) {
                            $this->info("✅ TEST - Would save: {$groupName}");
                        }
                    }
                    
                } catch (\Exception $e) {
                    $errors++;
                    if ($debug && $errors <= 3) {
                        $this->error("\n❌ Processing error row {$rowNum}: " . $e->getMessage());
                    }
                }
                
                $bar->advance();
            }
            
            $bar->finish();
            
            // Show summary
            $this->showSummary($processed, $skipped, $errors, $testMode);
            
        } catch (\Exception $e) {
            $this->error("❌ Import failed: " . $e->getMessage());
            if ($debug) {
                $this->error("  Trace: " . $e->getTraceAsString());
            }
            return 1;
        }
        
        return 0;
    }
    
    /**
     * Map column names to indexes
     */
    private function mapColumns($headers, $debug = false)
    {
        $mapping = [];
        
        // Common variations of column names
        $columnPatterns = [
            'BranchID' => ['branchid', 'branch id', 'branch_id', 'branch code'],
            'Village' => ['village'],
            'Credit Officer ID' => ['credit officer id', 'credit officer', 'officer id', 'credit_officer_id'],
            'Group ID' => ['group id', 'groupid', 'group_id'],
            'Group Name' => ['group name', 'groupname', 'group_name'],
            'Group Product ID' => ['group product id', 'product id', 'group_product_id'],
            'Savings Balance B4' => ['savings balance b4', 'savings b4', 'savings_b4'],
            'Savings Balance After' => ['savings balance after', 'savings after', 'savings_after'],
            'Loan balance b4' => ['loan balance b4', 'loan b4', 'loan_b4'],
            'Loan balance after' => ['loan balance after', 'loan after', 'loan_after'],
            'Arrears B4' => ['arrears b4', 'arrears_b4'],
            'Arrears after' => ['arrears after', 'arrears_after'],
            'Accts B4' => ['accts b4', 'accounts b4', 'accts_b4'],
            'Accts after' => ['accts after', 'accounts after', 'accts_after'],
            'Venue' => ['venue'],
            'Frequency' => ['frequency'],
            'Meeting Day' => ['meeting day', 'meeting_day'],
            'Time' => ['time'],
        ];
        
        foreach ($headers as $index => $header) {
            $header = trim(strtolower($header));
            
            foreach ($columnPatterns as $standardName => $patterns) {
                foreach ($patterns as $pattern) {
                    if (strpos($header, $pattern) !== false) {
                        $mapping[$standardName] = $index;
                        break 2; // Break out of both inner loops
                    }
                }
            }
        }
        
        if ($debug) {
            $this->info("\n🗺️  Column Mapping Results:");
            foreach ($mapping as $columnName => $index) {
                $this->info("  {$columnName} → Column index {$index}");
            }
            
            $missing = [];
            foreach (array_keys($columnPatterns) as $required) {
                if (!isset($mapping[$required])) {
                    $missing[] = $required;
                }
            }
            
            if (!empty($missing)) {
                $this->warn("\n⚠️  Missing columns: " . implode(', ', $missing));
            }
        }
        
        return $mapping;
    }
    
    /**
     * Get cell value using column mapping
     */
    private function getCellValue($row, $columnIndexes, $columnName)
    {
        if (!isset($columnIndexes[$columnName])) {
            return null;
        }
        
        $index = $columnIndexes[$columnName];
        
        if (!isset($row[$index])) {
            return null;
        }
        
        $value = $row[$index];
        
        if ($value === null || $value === '') {
            return null;
        }
        
        return is_string($value) ? trim($value) : $value;
    }
    
    /**
     * Clean branch code
     */
    private function cleanBranchCode($code)
    {
        if (empty($code)) {
            return null;
        }
        
        $clean = trim((string)$code);
        
        // Remove any non-digit characters
        $clean = preg_replace('/[^0-9]/', '', $clean);
        
        // If empty after cleaning, return null
        if (empty($clean)) {
            return null;
        }
        
        // Pad to 3 digits
        return str_pad($clean, 3, '0', STR_PAD_LEFT);
    }
    
    /**
     * Parse number
     */
    private function parseNumber($value)
    {
        if ($value === null || $value === '') {
            return 0.00;
        }
        
        // If already numeric
        if (is_numeric($value)) {
            return floatval($value);
        }
        
        // Convert to string
        $value = trim((string)$value);
        
        // Remove commas from thousands
        $value = str_replace(',', '', $value);
        
        // Remove any remaining non-numeric characters except dots and minus
        $value = preg_replace('/[^0-9\.\-]/', '', $value);
        
        // Convert to float
        $result = floatval($value);
        
        return round($result, 2);
    }
    
    /**
     * Parse time
     */
    private function parseTime($value)
    {
        if (empty($value)) {
            return null;
        }
        
        if (is_numeric($value)) {
            // Excel time (0.5 = 12:00:00)
            if ($value < 1) {
                $seconds = $value * 86400;
                $hours = floor($seconds / 3600);
                $minutes = floor(($seconds % 3600) / 60);
                return sprintf('%02d:%02d:00', $hours, $minutes);
            }
            // Hour as number (like 11)
            $hours = intval($value);
            if ($hours >= 0 && $hours <= 23) {
                return sprintf('%02d:00:00', $hours);
            }
        }
        
        if (is_string($value)) {
            $value = trim($value);
            // Try to parse various time formats
            $formats = ['H:i:s', 'H:i', 'h:i:s A', 'h:i A'];
            foreach ($formats as $format) {
                $date = \DateTime::createFromFormat($format, $value);
                if ($date !== false) {
                    return $date->format('H:i:s');
                }
            }
        }
        
        return null;
    }
    
    /**
     * Show summary
     */
    private function showSummary($processed, $skipped, $errors, $testMode)
    {
        $this->newLine(2);
        $this->info(str_repeat("=", 60));
        $this->info("📊 IMPORT SUMMARY");
        $this->info(str_repeat("=", 60));
        $this->info("✅ Processed: {$processed} groups");
        $this->info("⚠️  Skipped: {$skipped} rows");
        $this->info("❌ Errors: {$errors}");
        
        if ($testMode) {
            $this->info("\n🔍 TEST MODE - No data saved to database");
        } else {
            $total = Group::count();
            $this->info("📋 Total groups in database: {$total}");
            
            // Show sample of imported data
            if ($total > 0) {
                $this->info("\n📊 Sample of imported data (first 3 records):");
                $sample = Group::with('outpost')
                    ->select('group_name', 'branch_id', 'loan_balance_b4', 'loan_balance_after')
                    ->limit(3)
                    ->get();
                
                foreach ($sample as $group) {
                    $this->info("  📍 {$group->group_name} (Branch: {$group->branch_id})");
                    $this->info("     Loan B4: " . number_format($group->loan_balance_b4, 2));
                    $this->info("     Loan After: " . number_format($group->loan_balance_after, 2));
                }
            }
        }
        
        $this->newLine();
        $this->info("🎉 Done!");
    }
}