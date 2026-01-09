<?php

use App\Http\Controllers\IndexController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Route::get('/', function () {
//    
// })->name('home');

Route::get('/', [IndexController::class, 'index'])->name('home');

Route::get('showOutpostGroups/{outpost_id}', [IndexController::class, 'showOutpostGroups'])->name('outposts.groups');

Route::get('showIndividualGroup/{group_id}', [IndexController::class, 'showSingleGroup'])->name('groups.show');

Route::post('commentsUpdate', [IndexController::class, 'commentsUpdate'])->name('comments.update');

Route::post('issuesStore', [IndexController::class, 'issuesStore'])->name('issues.store');

Route::delete('delete/issue/{id}', [IndexController::class, 'destroyIssue'])->name('issues.destroy');
