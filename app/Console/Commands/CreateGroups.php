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
            
            // Get mapping between Excel BranchID and Outpost IDs
            $branchToOutpostMapping = $this->getBranchToOutpostMapping();
            
            if ($debug) {
                $this->info("\n🗺️  Branch to Outpost Mapping:");
                foreach ($branchToOutpostMapping as $excelBranch => $outpostId) {
                    $this->info("  Excel Branch '{$excelBranch}' → Outpost ID: {$outpostId}");
                }
            }
            
            // Get all outposts for reference and auto-mapping
            $outposts = Outpost::all();
            
            // Create lookup for auto-mapping by branch code
            $outpostsByBranchCode = [];
            foreach ($outposts as $outpost) {
                if (!empty($outpost->branch_code)) {
                    $cleanCode = $this->cleanExcelBranchCode($outpost->branch_code);
                    $outpostsByBranchCode[$cleanCode] = $outpost;
                }
            }
            
            // Process data
            $totalRows = count($sheet) - 1;
            $processed = 0;
            $skipped = 0;
            $errors = 0;
            
            // Track statistics
            $stats = [
                'with_outpost' => 0,
                'without_outpost' => 0,
                'excel_branches' => [],
                'unmapped_branches' => [],
                'auto_mapped' => 0,
                'manual_mapped' => 0,
            ];
            
            $this->info("\n🔄 Processing {$totalRows} rows...");
            $bar = $this->output->createProgressBar($totalRows);
            $bar->start();
            
            for ($i = 1; $i < count($sheet); $i++) {
                $row = $sheet[$i];
                $rowNum = $i + 1;
                
                try {
                    // Extract values using dynamic column mapping
                    $excelBranchId = $this->getCellValue($row, $columnIndexes, 'BranchID');
                    $groupName = $this->getCellValue($row, $columnIndexes, 'Group Name');
                    $groupId = $this->getCellValue($row, $columnIndexes, 'Group ID');
                    
                    // Group ID is REQUIRED - skip if missing
                    if (empty($groupId)) {
                        $skipped++;
                        if ($debug && $skipped <= 3) {
                            $this->warn("\n⚠️ Row {$rowNum} skipped - missing Group ID");
                        }
                        $bar->advance();
                        continue;
                    }
                    
                    // Group Name is REQUIRED - skip if missing
                    if (empty($groupName)) {
                        $skipped++;
                        if ($debug && $skipped <= 3) {
                            $this->warn("\n⚠️ Row {$rowNum} skipped - missing Group Name");
                        }
                        $bar->advance();
                        continue;
                    }
                    
                    // Clean the Excel branch ID
                    $excelBranchId = $this->cleanExcelBranchCode($excelBranchId);
                    
                    // Track unique Excel branch codes
                    if ($excelBranchId && !in_array($excelBranchId, $stats['excel_branches'])) {
                        $stats['excel_branches'][] = $excelBranchId;
                    }
                    
                    // Determine outpost_id using multiple methods
                    $outpostId = null;
                    $mappingMethod = '';
                    
                    // Method 1: Manual mapping
                    if ($excelBranchId && isset($branchToOutpostMapping[$excelBranchId])) {
                        $outpostId = $branchToOutpostMapping[$excelBranchId];
                        $mappingMethod = 'manual_mapping';
                        $stats['manual_mapped']++;
                    }
                    
                    // Method 2: Auto-match by branch code
                    if (!$outpostId && $excelBranchId && isset($outpostsByBranchCode[$excelBranchId])) {
                        $outpostId = $outpostsByBranchCode[$excelBranchId]->id;
                        $mappingMethod = 'auto_matched';
                        $stats['auto_mapped']++;
                    }
                    
                    // Method 3: Try to find by Excel branch code as outpost ID
                    if (!$outpostId && $excelBranchId && is_numeric($excelBranchId)) {
                        $numericId = intval($excelBranchId);
                        $outpost = $outposts->firstWhere('id', $numericId);
                        if ($outpost) {
                            $outpostId = $outpost->id;
                            $mappingMethod = 'id_match';
                            $stats['manual_mapped']++;
                        }
                    }
                    
                    // If still no outpost, track it but STILL IMPORT THE GROUP
                    if (!$outpostId) {
                        $outpostId = null; // Will be stored as NULL in database
                        $mappingMethod = 'no_match';
                        $stats['without_outpost']++;
                        
                        if ($excelBranchId && !in_array($excelBranchId, $stats['unmapped_branches'])) {
                            $stats['unmapped_branches'][] = $excelBranchId;
                        }
                        
                        if ($debug && $stats['without_outpost'] <= 3) {
                            $this->warn("\n⚠️ Row {$rowNum} - No outpost mapping for Excel branch '{$excelBranchId}'");
                            $this->warn("  Group ID: {$groupId}, Name: '{$groupName}'");
                            $this->warn("  Group will be imported WITHOUT outpost_id");
                        }
                    } else {
                        $stats['with_outpost']++;
                    }
                    
                    // Prepare data using dynamic column mapping
                    $groupData = [
                        'outpost_id' => $outpostId,
                        'branch_id' => $excelBranchId, // Store the Excel branch code
                        'village' => $this->getCellValue($row, $columnIndexes, 'Village'),
                        'credit_officer_id' => $this->getCellValue($row, $columnIndexes, 'Credit Officer ID') ?: 'UNKNOWN',
                        'group_id' => $groupId,
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
                        $this->info("  Group ID: {$groupId}");
                        $this->info("  Excel Branch ID: '{$excelBranchId}'");
                        $this->info("  Mapping Method: {$mappingMethod}");
                        $this->info("  Outpost ID: " . ($outpostId ?: 'NULL'));
                        $this->info("  Group Name: '{$groupName}'");
                    }
                    
                    if (!$testMode) {
                        try {
                            // Always use group_id as unique identifier
                            Group::updateOrCreate(
                                ['group_id' => $groupId],
                                $groupData
                            );
                            
                            if ($debug && $processed < 3) {
                                $this->info("  ✅ Group imported (ID: {$groupId})");
                            }
                            $processed++;
                        } catch (\Exception $e) {
                            $errors++;
                            if ($debug && $errors <= 3) {
                                $this->error("\n❌ Database error row {$rowNum}: " . $e->getMessage());
                                $this->error("  Group ID: {$groupId}");
                            }
                        }
                    } else {
                        $processed++;
                        if ($debug && $processed <= 3) {
                            $this->info("  🔍 TEST - Would import Group ID: {$groupId}");
                        }
                    }
                    
                } catch (\Exception $e) {
                    $errors++;
                    if ($debug && $errors <= 3) {
                        $this->error("\n❌ Processing error row {$rowNum}: " . $e->getMessage());
                        $this->error("  Trace: " . $e->getTraceAsString());
                    }
                }
                
                $bar->advance();
            }
            
            $bar->finish();
            
            // Show detailed statistics
            $this->showDetailedSummary($processed, $skipped, $errors, $testMode, $stats, $debug);
            
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
     * IMPORTANT: Update this based on your actual Excel branch codes
     */
    private function getBranchToOutpostMapping()
    {
        // CRITICAL: You MUST update this mapping based on your data
        // This maps Excel branch codes to your outpost IDs
        
        return [
            // Example mappings - UPDATE THESE BASED ON YOUR DATA
            
            // From your sample: Excel branch codes
            '000' => 1,   // Support Center/HQ
            '001' => 2,   // Embu
            '002' => 3,   // Kiritiri
            '003' => 4,   // etc...
            '004' => 5,
            '005' => 6,
            '006' => 7,
            '007' => 8,
            '008' => 9,
            '009' => 10,
            '010' => 11,
            '011' => 12,
            '012' => 13,
            '013' => 14,
            '014' => 15,
            '015' => 16,
            '016' => 17,
            '017' => 32,  // Kibwezi (from your example)
            '018' => 33,
            '019' => 34,
            '020' => 35,
            // Add more as needed...
            
            // You might also have reverse mappings (from your outpost branch_code to IDs)
        ];
        
        // NOTE: For a more automated approach, you could:
        // 1. Query all outposts
        // 2. Try to match Excel branch codes with outpost branch_code
        // 3. Create a mapping file that you can edit
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
        
        // Handle numeric values - pad to 3 digits
        if (is_numeric($clean)) {
            // Remove leading zeros first, then pad
            $clean = ltrim($clean, '0');
            if (empty($clean)) $clean = '0';
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
            
            // Check for critical columns
            $criticalColumns = ['Group ID', 'Group Name', 'BranchID'];
            foreach ($criticalColumns as $col) {
                if (!isset($mapping[$col])) {
                    $this->warn("⚠️  Critical column '{$col}' not found!");
                }
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
        
        if ($value === null || $value === '' || $value === 'NULL' || $value === 'null' || $value === '-') {
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
        
        // Handle empty values like '-', 'NULL', etc.
        if (in_array(strtoupper($value), ['-', 'NULL', 'N/A', ''])) {
            return 0.00;
        }
        
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
     * Show detailed summary
     */
    private function showDetailedSummary($processed, $skipped, $errors, $testMode, $stats, $debug = false)
    {
        $this->newLine(2);
        $this->info(str_repeat("=", 60));
        $this->info("📊 IMPORT SUMMARY");
        $this->info(str_repeat("=", 60));
        $this->info("✅ Processed: {$processed} groups");
        $this->info("⚠️  Skipped: {$skipped} rows (missing Group ID/Name)");
        $this->info("❌ Errors: {$errors}");
        
        $this->info("\n📍 Outpost Mapping Statistics:");
        $this->info("  Groups with outpost mapping: {$stats['with_outpost']}");
        $this->info("  Groups without outpost mapping: {$stats['without_outpost']}");
        $this->info("  Auto-mapped: {$stats['auto_mapped']}");
        $this->info("  Manual-mapped: {$stats['manual_mapped']}");
        
        // Show Excel branch codes found
        if (!empty($stats['excel_branches'])) {
            $this->info("\n📋 Excel Branch Codes Found (" . count($stats['excel_branches']) . " unique):");
            sort($stats['excel_branches']);
            $this->info("  " . implode(', ', $stats['excel_branches']));
        }
        
        // Show unmapped branches
        if (!empty($stats['unmapped_branches'])) {
            $this->info("\n⚠️  Unmapped Excel Branch Codes (" . count($stats['unmapped_branches']) . "):");
            sort($stats['unmapped_branches']);
            foreach ($stats['unmapped_branches'] as $branch) {
                $this->info("  '{$branch}'");
            }
            $this->info("\n💡 Tip: Add these to getBranchToOutpostMapping() method");
        }
        
        if ($testMode) {
            $this->info("\n🔍 TEST MODE - No data saved to database");
        } else {
            $total = Group::count();
            $this->info("\n📋 Total groups in database: {$total}");
            
            // Show groups without outpost
            $groupsWithoutOutpost = Group::whereNull('outpost_id')->count();
            if ($groupsWithoutOutpost > 0) {
                $this->info("⚠️  Groups without outpost mapping: {$groupsWithoutOutpost}");
                
                if ($debug) {
                    $this->info("\n📋 Sample groups without outpost:");
                    $sample = Group::whereNull('outpost_id')
                        ->select('group_id', 'group_name', 'branch_id')
                        ->limit(5)
                        ->get();
                    
                    foreach ($sample as $group) {
                        $this->info("  Group ID: {$group->group_id}, Name: '{$group->group_name}', Excel Branch: '{$group->branch_id}'");
                    }
                }
            }
            
            // Show sample of imported data
            if ($total > 0 && $debug) {
                $this->info("\n📊 Sample of imported data (first 3 records):");
                $sample = Group::with('outpost')
                    ->select('group_id', 'group_name', 'branch_id', 'outpost_id')
                    ->limit(3)
                    ->get();
                
                foreach ($sample as $group) {
                    $outpostName = $group->outpost ? $group->outpost->name : 'No Outpost';
                    $this->info("  📍 {$group->group_name}");
                    $this->info("     Group ID: {$group->group_id}");
                    $this->info("     Excel Branch: '{$group->branch_id}'");
                    $this->info("     Outpost: {$outpostName} (ID: {$group->outpost_id})");
                }
            }
        }
        
        $this->newLine();
        $this->info("🎉 Import completed!");
        
        // Final warning about unmapped branches
        if (!empty($stats['unmapped_branches'])) {
            $this->newLine();
            $this->warn("⚠️  IMPORTANT: Some groups were imported without outpost mapping!");
            $this->warn("    Update the getBranchToOutpostMapping() method with the missing branches above.");
            $this->warn("    Run the import again after updating the mapping.");
        }
    }
}