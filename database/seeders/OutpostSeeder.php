<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Outpost;

class OutpostSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data = [
            '000' => ['SUPPORTCENTER'],
            '001' => ['Embu', 'Runyenjes'],
            '002' => ['Kiritiri', 'Siakago'],
            '003' => ['Mwea'],
            '004' => ['Kerugoya'],
            '005' => ['Karatina', 'Nanyuki', 'Nyeri'],
            '006' => ['Nyahururu'],
            '007' => ['Naivasha', 'Nakuru'],
            '008' => ['Muranga', 'Thika'],
            '009' => ['Kasarani', 'Nairobi', 'Rongai', 'Utawala'],
            '010' => ['Kiambu', 'Kikuyu', 'Limuru'],
            '011' => ['Kitengela'],
            '012' => ['Machakos', 'Masii'],
            '013' => ['Tala'],
            '014' => ['Makueni'],
            '015' => ['Matuu', 'Mwingi'],
            '016' => ['Kitui', 'Nzombe'],
            '017' => ['Kibwezi', 'Taveta', 'Voi'],
            '018' => ['Emali', 'Loitoktok'],
            '019' => ['Chuka', 'Marimanti'],
            '020' => ['Nkubu'],
            '021' => ['Meru'],
            '022' => ['Laare', 'Maua'],
            '023' => ['Agency'],
        ];

        $outposts = [];
        foreach ($data as $branchCode => $names) {
            foreach ($names as $name) {
                $outposts[] = [
                    'branch_code' => $branchCode,
                    'name' => $name,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        // Insert all at once (more efficient)
        Outpost::insert($outposts);
    }
}