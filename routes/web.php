<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\ReservationController;

Route::get('/', [MenuController::class, 'index']);
Route::get('/menus', [MenuController::class, 'list']);
Route::post('/menus', [MenuController::class, 'store']);
Route::patch('/menus/{menu}/stock', [MenuController::class, 'updateStock']);
Route::get('/reservations', [ReservationController::class, 'index']);
Route::post('/reservations', [ReservationController::class, 'store']);
Route::patch('/reservations/{reservation}/status', [ReservationController::class, 'updateStatus']);
Route::delete('/reservations/{reservation}', [ReservationController::class, 'destroy']);
