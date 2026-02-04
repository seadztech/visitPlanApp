<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\LoanListingImport;

class ImportLoans extends Command
{
    protected $signature = 'loans:import {file}';
    protected $description = 'Import loan listings from Excel file';

    public function handle()
    {
        $filePath = $this->argument('file');

        if (!file_exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return;
        }

        Excel::import(new LoanListingImport, $filePath);

        $this->info('Loan data imported successfully.');
    }
}
