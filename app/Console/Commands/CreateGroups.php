<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Outpost;
use App\Models\Group;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
            
            // Create a manual mapping between Excel BranchID and Outpost IDs
            // Based on your data, you need to map Excel branch codes to actual outpost IDs
            // This is CRITICAL since Excel uses different codes than your database
            $branchToOutpostMapping = $this->getBranchToOutpostMapping();
            
            if ($debug) {
                $this->info("\n🗺️  Branch to Outpost Mapping:");
                foreach ($branchToOutpostMapping as $excelBranch => $outpostId) {
                    $this->info("  Excel Branch '{$excelBranch}' → Outpost ID: {$outpostId}");
                }
            }
            
            // Get all outposts for reference
            $outposts = Outpost::all()->keyBy('id');
            
            // Process data
            $totalRows = count($sheet) - 1;
            $processed = 0;
            $skipped = 0;
            $errors = 0;
            
            $this->info("\n🔄 Processing {$totalRows} rows...");
            $bar = $this->output->createProgressBar($totalRows);
            $bar->start();
            
            // Track Excel branch codes for debugging
            $excelBranches = [];
            
            for ($i = 1; $i < count($sheet); $i++) {
                $row = $sheet[$i];
                $rowNum = $i + 1;
                
                try {
                    // Extract values using dynamic column mapping
                    $excelBranchId = $this->getCellValue($row, $columnIndexes, 'BranchID');
                    $groupName = $this->getCellValue($row, $columnIndexes, 'Group Name');
                    
                    if (empty($excelBranchId) || empty($groupName)) {
                        $skipped++;
                        if ($debug && $skipped <= 3) {
                            $this->warn("\n⚠️ Row {$rowNum} skipped - missing BranchID or Group Name");
                            $this->warn("  BranchID: '{$excelBranchId}', Group Name: '{$groupName}'");
                        }
                        $bar->advance();
                        continue;
                    }
                    
                    // Clean the Excel branch ID
                    $excelBranchId = $this->cleanExcelBranchCode($excelBranchId);
                    
                    // Track unique Excel branch codes
                    if (!in_array($excelBranchId, $excelBranches)) {
                        $excelBranches[] = $excelBranchId;
                    }
                    
                    // Use the mapping to get the outpost ID
                    if (!isset($branchToOutpostMapping[$excelBranchId])) {
                        $skipped++;
                        if ($debug && $skipped <= 5) {
                            $this->warn("\n⚠️ Row {$rowNum} skipped - no mapping found for Excel branch '{$excelBranchId}'");
                            $this->warn("  Group: '{$groupName}'");
                            $this->warn("  Available mappings: " . implode(', ', array_keys($branchToOutpostMapping)));
                        }
                        $bar->advance();
                        continue;
                    }
                    
                    $outpostId = $branchToOutpostMapping[$excelBranchId];
                    
                    // Get the outpost for additional info
                    $outpost = $outposts->get($outpostId);
                    
                    if (!$outpost) {
                        $skipped++;
                        if ($debug && $skipped <= 3) {
                            $this->warn("\n⚠️ Row {$rowNum} skipped - outpost ID {$outpostId} not found in database");
                        }
                        $bar->advance();
                        continue;
                    }
                    
                    // Prepare data using dynamic column mapping
                    $groupData = [
                        'outpost_id' => $outpostId,
                        'branch_id' => $excelBranchId, // Store the Excel branch code
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
                        $this->info("  Excel Branch ID: '{$excelBranchId}'");
                        $this->info("  Mapped to Outpost ID: {$outpostId}");
                        $this->info("  Outpost Name: '{$outpost->name}'");
                        $this->info("  Outpost Branch Code: '{$outpost->branch_code}'");
                        $this->info("  Group: '{$groupName}'");
                        $this->info("  Stored branch_id in groups table: '{$excelBranchId}'");
                    }
                    
                    if (!$testMode) {
                        try {
                            // Save to database
                            if (!empty($groupData['group_id'])) {
                                // Use group_id as unique identifier
                                Group::updateOrCreate(
                                    ['group_id' => $groupData['group_id']],
                                    $groupData
                                );
                                $action = 'updated/created';
                            } else {
                                // Create new group without group_id
                                Group::create($groupData);
                                $action = 'created';
                            }
                            
                            if ($debug && $processed < 3) {
                                $this->info("  ✅ {$action} group in database");
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
                            $this->info("  🔍 TEST - Would save: {$groupName} → Outpost: {$outpostId}");
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
            
            // Show Excel branches found for debugging
            if ($debug && !empty($excelBranches)) {
                $this->info("\n\n📋 Excel Branch Codes Found:");
                sort($excelBranches);
                foreach ($excelBranches as $branch) {
                    $mapped = isset($branchToOutpostMapping[$branch]) ? "→ Outpost ID: {$branchToOutpostMapping[$branch]}" : "→ NO MAPPING";
                    $this->info("  '{$branch}' {$mapped}");
                }
            }
            
            // Show summary
            $this->showSummary($processed, $skipped, $errors, $testMode, $debug);
            
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
     * Get mapping between Excel BranchID and Outpost IDs
     * This is where you define how Excel codes map to your outposts
     */
    private function getBranchToOutpostMapping()
    {
        // This is the CRITICAL mapping between Excel branch codes and your outpost IDs
        // You need to update this based on your actual data
        
        // Based on your example:
        // Excel has '000', '001', '002', etc.
        // Your outposts have different codes like '017' for Kibwezi
        
        return [
            '000' => 1,  // Map Excel '000' to outpost ID 1 (Head Office/Support Center)
            '001' => 2,  // Map Excel '001' to outpost ID 2 (Embu)
            '002' => 3,  // Map Excel '002' to outpost ID 3 (Kiritiri)
            '003' => 4,  // Map Excel '003' to outpost ID 4
            '004' => 5,  // Map Excel '004' to outpost ID 5
            '005' => 6,  // Map Excel '005' to outpost ID 6
            '006' => 7,  // Map Excel '006' to outpost ID 7
            '007' => 8,  // Map Excel '007' to outpost ID 8
            '008' => 9,  // Map Excel '008' to outpost ID 9
            '009' => 10, // Map Excel '009' to outpost ID 10
            '010' => 11, // Map Excel '010' to outpost ID 11
            '011' => 12, // Map Excel '011' to outpost ID 12
            '012' => 13, // Map Excel '012' to outpost ID 13
            '013' => 14, // Map Excel '013' to outpost ID 14
            '014' => 15, // Map Excel '014' to outpost ID 15
            '015' => 16, // Map Excel '015' to outpost ID 16
            '016' => 17, // Map Excel '016' to outpost ID 17
            '017' => 32, // Map Excel '017' to outpost ID 32 (Kibwezi - based on your example)
            '018' => 33, // Map Excel '018' to outpost ID 33
            '019' => 34, // Map Excel '019' to outpost ID 34
            // Add more mappings as needed
        ];
        
        // Alternatively, you could query the database to build this mapping
        // based on branch names or other criteria:
        /*
        $mapping = [];
        $outposts = Outpost::all();
        
        foreach ($outposts as $outpost) {
            // Try to match based on name or other logic
            // This depends on your specific data
        }
        
        return $mapping;
        */
    }
    
    /**
     * Clean Excel branch code
     */
    private function cleanExcelBranchCode($code)
    {
        if (empty($code)) {
            return null;
        }
        
        // Convert to string and trim
        $clean = trim((string)$code);
        
        // Pad to 3 digits if it's numeric
        if (is_numeric($clean)) {
            return str_pad($clean, 3, '0', STR_PAD_LEFT);
        }
        
        return $clean;
    }
    
    /**
     * Map column names to indexes
     */
    private function mapColumns($headers, $debug = false)
    {
        $mapping = [];
        
        // Common variations of column names
        $columnPatterns = [
            'BranchID' => ['branchid', 'branch id', 'branch_id', 'branch code', 'branch', 'branchcode'],
            'Village' => ['village'],
            'Credit Officer ID' => ['credit officer id', 'credit officer', 'officer id', 'credit_officer_id', 'co id'],
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
            if ($header === null) continue;
            
            $header = trim(strtolower((string)$header));
            
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
                $originalHeader = $headers[$index] ?? 'N/A';
                $this->info("  {$columnName} → Column index {$index} ('{$originalHeader}')");
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
        
        if ($value === null || $value === '' || $value === 'NULL' || $value === 'null') {
            return null;
        }
        
        return is_string($value) ? trim($value) : $value;
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
        
        // Remove currency symbols, commas, and other non-numeric chars
        $value = str_replace(['$', '€', '£', ',', ' '], '', $value);
        
        // Check for negative numbers in parentheses format: (123.45)
        if (preg_match('/^\((.*?)\)$/', $value, $matches)) {
            $value = '-' . $matches[1];
        }
        
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
            $formats = ['H:i:s', 'H:i', 'h:i:s A', 'h:i A', 'g:i A', 'g:i:s A'];
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
    private function showSummary($processed, $skipped, $errors, $testMode, $debug = false)
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
            
            // Show distribution by outpost
            if ($total > 0) {
                $this->info("\n📍 Distribution by Outpost:");
                $distribution = Group::select('outpost_id', DB::raw('count(*) as count'))
                    ->groupBy('outpost_id')
                    ->with('outpost')
                    ->get();
                
                foreach ($distribution as $dist) {
                    $outpostName = $dist->outpost ? $dist->outpost->name : 'Unknown';
                    $this->info("  Outpost #{$dist->outpost_id} ({$outpostName}): {$dist->count} groups");
                }
            }
        }
        
        $this->newLine();
        $this->info("🎉 Done!");
    }
}