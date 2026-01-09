<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Objective;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DiscussionPoint extends Model
{
    
    public function comments(): HasMany {
        return $this->hasMany(Comment::class);
    } 

    
}
