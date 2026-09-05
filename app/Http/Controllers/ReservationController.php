<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReservationController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Reservation::query()
                ->latest()
                ->get()
                ->map(fn (Reservation $reservation) => $this->formatReservation($reservation))
                ->values()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => ['nullable', 'string', 'max:30'],
            'source' => ['nullable', Rule::in(['online', 'walk-in'])],
            'userId' => ['nullable', 'string', 'max:100'],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'date' => ['required', 'date'],
            'time' => ['required', 'date_format:H:i'],
            'people' => ['required', 'integer', 'min:1'],
            'table' => ['nullable', 'string', 'max:100'],
            'note' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.menuId' => ['required', 'string', 'max:100'],
            'items.*.name' => ['required', 'string', 'max:255'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'items.*.price' => ['required', 'integer', 'min:0'],
            'total' => ['required', 'integer', 'min:0'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        $source = $validated['source'] ?? 'online';

        if (! empty($validated['id']) && Reservation::whereKey($validated['id'])->exists()) {
            return response()->json($this->formatReservation(Reservation::findOrFail($validated['id'])));
        }

        $reservation = Reservation::create([
            'id' => $validated['id'] ?? $this->makeReservationId($source),
            'source' => $source,
            'user_id' => $validated['userId'] ?? null,
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'date' => $validated['date'],
            'time' => $validated['time'],
            'people' => $validated['people'],
            'table' => $validated['table'] ?? null,
            'note' => $validated['note'] ?? null,
            'items' => $validated['items'],
            'total' => $validated['total'],
            'status' => $validated['status'] ?? ($source === 'walk-in' ? 'Diproses' : 'Menunggu Konfirmasi'),
        ]);

        return response()->json($this->formatReservation($reservation), 201);
    }

    public function updateStatus(Request $request, Reservation $reservation): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['Menunggu Konfirmasi', 'Diproses', 'Siap Disajikan', 'Selesai', 'Dibatalkan'])],
        ]);

        $reservation->update(['status' => $validated['status']]);

        return response()->json($this->formatReservation($reservation));
    }

    public function destroy(Reservation $reservation): JsonResponse
    {
        $reservation->delete();

        return response()->json(['deleted' => true]);
    }

    private function makeReservationId(string $source): string
    {
        $prefix = $source === 'walk-in' ? 'ORD' : 'RSV';

        do {
            $id = $prefix . '-' . substr((string) round(microtime(true) * 1000), -6) . random_int(10, 99);
        } while (Reservation::whereKey($id)->exists());

        return $id;
    }

    private function formatReservation(Reservation $reservation): array
    {
        return [
            'id' => $reservation->id,
            'source' => $reservation->source,
            'userId' => $reservation->user_id,
            'name' => $reservation->name,
            'phone' => $reservation->phone,
            'date' => $reservation->date,
            'time' => $reservation->time,
            'people' => $reservation->people,
            'table' => $reservation->table,
            'note' => $reservation->note,
            'items' => $reservation->items,
            'total' => $reservation->total,
            'status' => $reservation->status,
            'createdAt' => $reservation->created_at?->toISOString(),
        ];
    }
}
