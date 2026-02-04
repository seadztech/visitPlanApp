<?php

namespace App\Http\Controllers;

use App\Models\LoanListing;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LoanListingsController extends Controller
{
    //

    public function index()
    {
        // Get search term from request
        $search = request()->input('search');
        $perPage = request()->input('per_page');

        // Start query
        $query = LoanListing::query();

        // If search term exists, filter results
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('client_id', 'like', "%{$search}%")
                    ->orWhere('account_title', 'like', "%{$search}%")
                    ->orWhere('group_name', 'like', "%{$search}%")
                    ->orWhere('village', 'like', "%{$search}%")
                    ->orWhere('mobile', 'like', "%{$search}%");
            });
        }

        // Get all listings for stats (without pagination)
        $allListings = $query->get();

        // Calculate location stats
        $withLocation = $allListings->filter(function ($listing) {
            return !empty($listing->latitude) && !empty($listing->longitude);
        })->count();

        $withoutLocation = $allListings->filter(function ($listing) {
            return empty($listing->latitude) || empty($listing->longitude);
        })->count();

        $totalListings = $allListings->count();
        $locationPercentage = $totalListings > 0 ? round(($withLocation / $totalListings) * 100, 1) : 0;

        // Paginate results (10 per page, change as needed)
        $paginatedListings = $query->orderBy('disbursed_on', 'desc')->paginate($perPage)->withQueryString();

        // Pass to Inertia
        return Inertia::render('loans/Index', [
            'listings' => $paginatedListings,
            'stats' => [
                'total' => $totalListings,
                'with_location' => $withLocation,
                'without_location' => $withoutLocation,
                'location_percentage' => $locationPercentage,
            ],
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function show(string $id)
    {
        $loanListing = LoanListing::findOrFail($id);
        return Inertia::render('loans/show', [
            'listing' => $loanListing,
        ]);
    }

    public function captureLocation(string $id)
    {
        $loanListing = LoanListing::findOrFail($id);
        
        return Inertia::render('loans/LocationCapture', [
            'listing' => $loanListing,
            'GOOGLE_MAPS_API_KEY' => env('GOOGLE_MAPS_API_KEY'),
        ]);
    }

    public function update(Request $request, string $id)
    {
        $loanListing = LoanListing::findOrFail($id);
        
        $validated = $request->validate([
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'address' => ['nullable', 'string', 'max:500'],
        ]);
        
        $loanListing->update($validated);
        
        // Return to the show page with success message
        return redirect()->route('loans.listing.show', $loanListing->id)
            ->with('success', 'Location updated successfully!');
    }
}

