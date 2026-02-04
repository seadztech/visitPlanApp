<?php

namespace App\Imports;

use App\Models\LoanListing;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Facades\Log;

class LoanListingImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        // 1️⃣ Normalize headers: lowercase, remove spaces, trim
        $normalized = [];
        foreach ($row as $key => $value) {
            $cleanKey = strtolower(str_replace(' ', '_', trim($key)));
            $normalized[$cleanKey] = trim($value);
        }

        // 2️⃣ Helper to convert numeric fields safely
        $numeric = function ($value) {
            return isset($value) && is_numeric($value) ? $value : null;
        };

        // 3️⃣ Prepare required fields with fallback
        $clientId = $normalized['client_id'] ?? $normalized['clientid'] ?? 'UNKNOWN';
        $accountTitle = $normalized['title_of_account'] ?? $normalized['account_title'] ?? 'UNKNOWN';
        $mobile = $normalized['mobile'] ?? 'UNKNOWN';
        $idNumber = $normalized['idno'] ?? $normalized['id_number'] ?? 'UNKNOWN';
        $applicationId = $normalized['application_id'] ?? 'UNKNOWN';
        $loanType = $normalized['loan_type'] ?? 'UNKNOWN';
        $productId = $normalized['product_id'] ?? 'UNKNOWN';

        // 4️⃣ Log if critical fields were missing (optional)
        if ($clientId === 'UNKNOWN' || $accountTitle === 'UNKNOWN' || $mobile === 'UNKNOWN') {
            Log::warning('LoanListingImport: Missing critical field(s)', [
                'client_id' => $clientId,
                'account_title' => $accountTitle,
                'mobile' => $mobile,
                'row' => $row,
            ]);
        }

        // 5️⃣ Return new LoanListing model
        return new LoanListing([
            'branch_id'             => $normalized['branchid'] ?? null,
            'village'               => $normalized['village'] ?? null,
            'credit_officer_id'     => $normalized['credit_officer_id'] ?? null,
            'group_id'              => $normalized['group_id'] ?? null,
            'group_name'            => $normalized['group_name'] ?? null,
            'client_id'             => $clientId,
            'account_title'         => $accountTitle,
            'account_id'            => $normalized['account_id'] ?? null,
            'mobile'                => $mobile,
            'id_number'             => $idNumber,
            'gender'                => $normalized['gender'] ?? null,
            'dob'                   => $normalized['dob'] ?? null,
            'age'                   => $normalized['age'] ?? null,
            'application_id'        => $applicationId,
            'loan_type'             => $loanType,
            'product_id'            => $productId,
            'loan_series'           => $numeric($normalized['loanseries'] ?? null),
            'interest_rate'         => $numeric($normalized['interest_rate'] ?? null),
            'interest'              => $numeric($normalized['interest'] ?? null),
            'terms'                 => $numeric($normalized['terms'] ?? null),
            'disbursed_amount'      => $numeric($normalized['disbursed_amount'] ?? null),
            'loan_purpose'          => $normalized['loan_purpose'] ?? null,
            'disbursed_on'          => $normalized['disbursed_on'] ?? null,
            'installment_start_date'=> $normalized['installment_start_date'] ?? null,
            'maturity_date'         => $normalized['maturitydate'] ?? $normalized['maturity_date'] ?? null,
            'disbursement_mode'     => $normalized['disbursement_mode'] ?? null,
            'frequency_id'          => $normalized['frequency_id'] ?? null,
            'green_practice'        => $normalized['green_practice'] ?? null,
            'latitude'              => $normalized['latitude'] ?? null,
            'longitude'             => $normalized['longitude'] ?? null,
        ]);
    }
}
