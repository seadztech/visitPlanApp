<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\DiscussionIssue;
use App\Models\Group;
use App\Models\Objective;
use App\Models\Outpost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class IndexController extends Controller
{
    //

    public function index()
    {
        $outposts = Outpost::all();

        // dd($outposts);

        // Pass outposts to the frontend
        return Inertia::render('Index', [
            'outposts' => $outposts
        ]);
    }

public function showOutpostGroups(Request $request, string $village)
{
    // Get pagination parameters from request
    $perPage = $request->input('per_page', 10);
    $page = $request->input('page', 1);
    $sortBy = $request->input('sort_by', 'group_name');
    $sortDirection = $request->input('sort_dir', 'asc');
    $search = $request->input('search', '');
    
    // Start building the query
    $query = Group::with('outpost', 'comments')
        ->where('village', $village);
    
    // Apply search if provided
    if ($search) {
        $query->where(function ($q) use ($search) {
            $q->where('group_name', 'LIKE', "%{$search}%")
              ->orWhere('group_id', 'LIKE', "%{$search}%")
              ->orWhere('credit_officer_id', 'LIKE', "%{$search}%")
              ->orWhere('village', 'LIKE', "%{$search}%");
        });
    }
    
    // Apply sorting
    $validSortColumns = ['group_name', 'comment_status', 'village', 'meeting_day', 
                        'savings_balance_after', 'loan_balance_after', 'created_at'];
    $sortBy = in_array($sortBy, $validSortColumns) ? $sortBy : 'group_name';
    $sortDirection = $sortDirection === 'desc' ? 'desc' : 'asc';
    
    $query->orderBy($sortBy, $sortDirection);
    
    // Paginate the results
    $paginator = $query->paginate($perPage, ['*'], 'page', $page);
    
    // Transform the groups with comment status
    $transformedGroups = $paginator->getCollection()->map(function ($group) {
        // Get comment counts using where clause
        $totalComments = DB::table('comments')
            ->where('group_id', $group->group_id)
            ->count();
        
        $nullComments = DB::table('comments')
            ->where('group_id', $group->group_id)
            ->where('comment', '')
            ->count();
        
        $nonNullComments = $totalComments - $nullComments;
        
        // Determine status
        if ($totalComments === 0) {
            $commentStatus = 'pending';
            $remainingComments = 0;
        } elseif ($nullComments === 0 && $nonNullComments > 0) {
            $commentStatus = 'completed';
            $remainingComments = 0;
        } elseif ($nullComments === 1 && $nonNullComments >= 0) {
            $commentStatus = 'in-progress';
            $remainingComments = 1;
        } else {
            $commentStatus = 'in-progress';
            $remainingComments = $nullComments;
        }
        
        // Add computed properties to the group
        $group->comment_status = $commentStatus;
        $group->remaining_comments = $remainingComments;
        $group->total_comments = $totalComments;
        
        return $group;
    });
    
    // Replace the collection with transformed data
    $paginator->setCollection($transformedGroups);
    
    return Inertia::render('OutPostGroups', [
        'groups' => $paginator->items(),
        'pagination' => [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ],
        'filters' => [
            'search' => $search,
            'sort_by' => $sortBy,
            'sort_dir' => $sortDirection,
            'per_page' => $perPage,
        ],
        'outpostId' => $village,
    ]);
}

    public function showSingleGroup(string $groupId)
    {
        // Load the group
        $group = Group::with('outpost')->findOrFail($groupId);

        /**
         * Your DB stores group_id as something like '00000007'
         * So we must use that value, not the numeric ID
         */
        $groupCode = $group->group_id;

        // Load objectives with only THIS group's comments
        $objectives = Objective::with([
            'discussionPoints.comments' => function ($query) use ($groupCode) {
                $query->where('group_id', $groupCode)
                    ->with('issues')
                    ->latest();
            }
        ])->get();

        /**
         * Transform into:
         * Objective → Comments → Discussion Point + Issues
         */
        $payload = $objectives->map(function ($objective) {

            $comments = collect();

            foreach ($objective->discussionPoints as $discussionPoint) {
                foreach ($discussionPoint->comments as $comment) {

                    $comments->push([
                        'id' => $comment->id,
                        'group_id' => ltrim($comment->group_id, '0'),
                        'comment' => $comment->comment,
                        'discussion_point' => [
                            'id' => $discussionPoint->id,
                            'point' => $discussionPoint->point,
                        ],
                        'issues' => $comment->issues->map(function ($issue) {
                            return [
                                'id' => $issue->id,
                                'issue' => $issue->issue,
                            ];
                        })->values()
                    ]);
                }
            }

            return [
                'id' => $objective->id,
                'objective' => $objective->objective,
                'created_at' => $objective->created_at,
                'updated_at' => $objective->updated_at,
                'comment' => $comments->values()
            ];
        });


        return Inertia::render('SingleGroup', [
            'group' => $group,
            'objectives' => $objectives
        ]);
    }



    public function commentsUpdate(Request $request, $id)
    {

        $comment = Comment::find($id);

        if (!$comment) {
            return response()->json([
                'status' => 'error',
                'message' => 'Comment not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'comment' => 'required|string|min:2|max:2000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'validation_error',
                'errors' => $validator->errors()
            ], 422);
        }


        $comment->comment = $request->comment;
        $comment->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Comment updated successfully',
            'data' => $comment
        ]);
    }



    public function issuesStore(Request $request)
    {

        $validator = Validator::make($request->all(), [
            'issue' => 'required|string|min:2|max:2000',
            'comment_id' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'validation_error',
                'errors' => $validator->errors()
            ], 422);
        }



        $issue = $request->id ? DiscussionIssue::find($request->id) :  new DiscussionIssue();

        $issue->issue = $request->issue;
        $issue->comment_id = $request->comment_id;

        $request->id ? $issue->update() : $issue->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Comment updated successfully',
            'data' => $issue
        ]);
    }


    public function destroyIssue(Request $request, string $id)
    {
        $issue = DiscussionIssue::find($id);

        if (!$issue) {
            return false;
        }

        $data = $issue->delete();

        return $data;
    }
}
