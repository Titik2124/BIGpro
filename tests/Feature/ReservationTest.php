<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReservationTest extends TestCase
{
    use RefreshDatabase;

    public function test_reservation_can_be_created_listed_updated_and_deleted(): void
    {
        $payload = [
            'source' => 'online',
            'userId' => 'USR-TEST',
            'name' => 'Budi',
            'phone' => '081234567890',
            'date' => '2026-09-05',
            'time' => '18:30',
            'people' => 2,
            'table' => 'Meja 1',
            'note' => 'Less sugar',
            'items' => [
                ['menuId' => 'M-001', 'name' => 'Prabu', 'qty' => 1, 'price' => 15000],
            ],
            'total' => 15000,
        ];

        $created = $this->postJson('/reservations', $payload)
            ->assertCreated()
            ->assertJsonPath('name', 'Budi')
            ->assertJsonPath('status', 'Menunggu Konfirmasi')
            ->json();

        $this->getJson('/reservations')
            ->assertOk()
            ->assertJsonPath('0.id', $created['id']);

        $this->patchJson("/reservations/{$created['id']}/status", ['status' => 'Diproses'])
            ->assertOk()
            ->assertJsonPath('status', 'Diproses');

        $this->deleteJson("/reservations/{$created['id']}")
            ->assertOk()
            ->assertJsonPath('deleted', true);
    }
}
