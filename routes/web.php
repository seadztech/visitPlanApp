<?php

use App\Http\Controllers\IndexController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Route::get('/', function () {
//    
// })->name('home');

Route::get('/', [IndexController::class, 'index'])->name('home');
Route::get('showOutpostGroups/{outpost_id}', [IndexController::class, 'showOutpostGroups'])->name('outposts.groups');

Route::get('showIndividualGroup/{group_id}', [IndexController::class, 'showSingleGroup'])->name('groups.show') ;
    