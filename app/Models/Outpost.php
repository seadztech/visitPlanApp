<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Group;

class Outpost extends Model
{
    protected $fillable = ['branch_code', 'name'];

    public function groups(): HasMany {
        return $this->hasMany(Group::class);
    }
}