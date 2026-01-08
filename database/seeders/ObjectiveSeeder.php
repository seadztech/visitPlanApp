<?php

namespace Database\Seeders;

use App\Models\Objective;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class ObjectiveSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $objectives = [
            [
                'objective' => 'Who BIMAS is',
                'discussion_points' => json_encode([
                    'Share the Mission and financial Inclusion agenda.',
                    'Credit provision services, difference between us and banks'
                ]),
            ],
            [
                'objective' => 'Explain CBK regulatory requirements on savings',
                'discussion_points' => json_encode([
                    'CBK Regulation - Share the advantages',
                    'Compliance - savings and previous discussion- Importance',
                    'Quarterly statements to be shared to clients through email'
                ]),
            ],
            [
                'objective' => 'Explain BIMAS implementation on the same',
                'discussion_points' => json_encode([
                    'Savings utilised to repay loans and create new funding opportunities',
                    'Emphasize that clients to continue to repay loans even after payoffs',
                    'Clients with savings no loan- co guarantee- Encourage discussion on how the group clears loans for defaulters',
                    'Waiver on interest for prepayments',
                    'Clients who paid for defaulted clients and want their savings back',
                    'Confirm we close in 6 months'
                ]),
            ],
            [
                'objective' => 'Show impact of payoff on group status',
                'discussion_points' => json_encode([
                    'Be clear on savings used to repay loans.',
                    'Have data per client per group'
                ]),
            ],
            [
                'objective' => 'Discuss new lending model',
                'discussion_points' => json_encode([
                    'Group co-guarantee',
                    'Group cohesion even without savings',
                    'New model of loan graduation based on repayment rate',
                    'Loan Securities, appraisals, chattels for group clients',
                    'Diversify group activities - Merry go round and welfare activities'
                ]),
            ],
            [
                'objective' => 'Demonstrate business opportunity',
                'discussion_points' => json_encode([
                    'Assure clients of our intentions to do business with them.',
                    'Savings was never part of the money for onlending.',
                    'Sample a few clients who can apply top ups.',
                    'Encourage new applications for those with no loans'
                ]),
            ],
            [
                'objective' => 'Clients training on financial management',
                'discussion_points' => json_encode([
                    'Briefly share tips on Personal finance',
                    'Encourage budgeting',
                    'Encourage clients to track their expenditure',
                    'Encourage to diversify income',
                    'Share against overindebtedness',
                    'Planning before borrowing'
                ]),
            ],
            [
                'objective' => 'Feedback on services',
                'discussion_points' => json_encode([
                    'Enhanced benefits- Hosi cash as benefit',
                    'Customer complaint resolution-Number 0111056010',
                    'Google form to do a brief survey'
                ]),
            ],
            [
                'objective' => 'Group Feedback on any issue above',
                'discussion_points' => json_encode([
                    'Listen from the group, document- monitoring tool'
                ]),
            ],
            [
                'objective' => 'Confirmation on group geo locations',
                'discussion_points' => json_encode([
                    'Marangu to guide on web- start and end meetings'
                ]),
            ],
        ];

        foreach ($objectives as $objective) {
            Objective::create([
                'objective' => $objective['objective'],
                'discussion_points' => $objective['discussion_points'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}