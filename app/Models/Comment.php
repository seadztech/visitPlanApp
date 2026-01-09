<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Comment extends Model
{
    //

    public function group(): BelongsTo {
        return $this->belongsTo(Group::class);
    }

 
    public function discussionPoint(): BelongsTo {
        return $this->belongsTo(DiscussionPoint::class);
    }

    public function issues():HasMany {
        return $this->hasMany(DiscussionIssue::class);
    }
}
