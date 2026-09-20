<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->string('active_table')->nullable()->after('table');
        });

        // Pertahankan penguncian untuk data reservasi yang sudah ada sebelum fitur ini dipasang.
        // Bila ada data lama yang bentrok, reservasi pertama tetap memegang meja; sisanya dapat ditangani admin.
        $claimedTables = [];
        DB::table('reservations')
            ->whereNotNull('table')
            ->whereNotIn('status', ['Selesai', 'Dibatalkan'])
            ->orderBy('created_at')
            ->each(function (object $reservation) use (&$claimedTables): void {
                if (in_array($reservation->table, $claimedTables, true)) {
                    return;
                }

                DB::table('reservations')->where('id', $reservation->id)->update([
                    'active_table' => $reservation->table,
                ]);
                $claimedTables[] = $reservation->table;
            });

        Schema::table('reservations', function (Blueprint $table) {
            $table->unique('active_table');
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropUnique(['active_table']);
            $table->dropColumn('active_table');
        });
    }
};
