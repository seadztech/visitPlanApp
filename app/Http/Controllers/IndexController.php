<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\Objective;
use App\Models\Outpost;
use Illuminate\Http\Request;
use Inertia\Inertia;

class IndexController extends Controller
{
    //

    public function index()
    {
        $outposts = Outpost::all();

        // Pass outposts to the frontend
        return Inertia::render('Index', [
            'outposts' => $outposts
        ]);
    }



    public function showOutpostGroups(Request $request, string $outpostId)
    {
        $groups = Group::with('outpost')->where('outpost_id', $outpostId)->get();
        
        return Inertia::render('OutPostGroups', [
            'groups' => $groups,
            'outpostId' => $outpostId
        ]);
    }


    public function showSingleGroup(string $groupId)
    {

        $group = Group::with('outpost')->find($groupId);
        $objectives = Objective::all();

        return Inertia::render('SingleGroup', [
            'group' => $group,
            'objectives' => $objectives
        ]);
    }
}
