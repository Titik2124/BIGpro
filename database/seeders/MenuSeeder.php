<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\Menu::create([
            'nama_menu' => 'Cheesecake',
            'harga' => 15000,
            'stok' => 18,
            'foto' => 'chessecake.jpeg'
        ]);

        \App\Models\Menu::create([
            'nama_menu' => 'Mix',
            'harga' => 25000,
            'stok' => 15,
            'foto' => 'paket mix.jpeg'
        ]);

        \App\Models\Menu::create([
            'nama_menu' => 'Paket Cireng Kentang',
            'harga' => 20000,
            'stok' => 15,
            'foto' => 'cireng kentang.jpeg'
        ]);
    }
}
