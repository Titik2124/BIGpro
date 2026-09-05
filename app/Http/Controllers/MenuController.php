<?php

namespace App\Http\Controllers;

use App\Models\Menu;
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
}