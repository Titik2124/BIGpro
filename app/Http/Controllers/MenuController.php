<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function index()
    {
        // Mengambil semua data menu dari database
        $semuaMenu = Menu::all();

        // Mengirimkan variabel $semuaMenu ke welcome.blade.php
        return view('welcome', compact('semuaMenu'));
    }

    /** Menu dan stok selalu dibaca dari database, bukan dari browser. */
    public function list(): JsonResponse
    {
        return response()->json(Menu::query()->orderBy('id')->get()->map(
            fn (Menu $menu) => $this->formatMenu($menu)
        )->values());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'price' => ['required', 'integer', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'image' => ['nullable', 'string', 'max:255'],
        ]);

        $menu = Menu::create([
            'nama_menu' => $data['name'],
            'harga' => $data['price'],
            'stok' => $data['stock'],
            'foto' => $data['image'] ?? 'logo.jpeg',
        ]);

        return response()->json($this->formatMenu($menu), 201);
    }

    public function updateStock(Request $request, Menu $menu): JsonResponse
    {
        $data = $request->validate(['stock' => ['required', 'integer', 'min:0']]);
        $menu->update(['stok' => $data['stock']]);

        return response()->json($this->formatMenu($menu->fresh()));
    }

    private function formatMenu(Menu $menu): array
    {
        return [
            'id' => 'M-' . $menu->id,
            'name' => $menu->nama_menu,
            'category' => 'Menu',
            'price' => (int) $menu->harga,
            'stock' => (int) $menu->stok,
            'desc' => 'Menu Kuna Kopi.',
            'image' => 'images/' . ($menu->foto ?: 'logo.jpeg'),
        ];
    }
}
