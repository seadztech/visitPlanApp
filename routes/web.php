<?php

use App\Http\Controllers\IndexController;
use App\Http\Controllers\LoanListingsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Route::get('/', function () {
//    
// })->name('home');

Route::get('/', [IndexController::class, 'index'])->name('home');

Route::get('showOutpostGroups/{outpost_id}', [IndexController::class, 'showOutpostGroups'])->name('outposts.groups');

Route::get('showIndividualGroup/{village}', [IndexController::class, 'showSingleGroup'])->name('groups.show');

Route::post('commentsUpdate/{id}', [IndexController::class, 'commentsUpdate'])->name('comments.update');

Route::post('issuesStore', [IndexController::class, 'issuesStore'])->name('issues.store');

Route::delete('delete/issue/{id}', [IndexController::class, 'destroyIssue'])->name('issues.destroy');



// Loan Listings 

Route::get('loanListings', [LoanListingsController::class, 'index'])->name('loans.listing.index');
Route::get('loanListings/{id}', [LoanListingsController::class, 'show'])->name('loans.listing.show');
Route::post('loanListings/{id}', [LoanListingsController::class, 'update'])->name('loans.listing.update');


Route::get('loanListings/{id}/capture-location', [LoanListingsController::class, 'captureLocation'])
    ->name('loans.listing.capture-location');

Route::post('loanListings/{id}', [LoanListingsController::class, 'update'])
    ->name('loans.listing.update');
