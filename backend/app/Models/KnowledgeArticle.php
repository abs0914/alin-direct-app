<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KnowledgeArticle extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'category',
        'content',
        'tags',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'tags'      => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public static function activeForCategory(string $category): \Illuminate\Support\Collection
    {
        return static::where('is_active', true)
            ->where('category', $category)
            ->get(['title', 'content']);
    }

    public static function allActive(): \Illuminate\Support\Collection
    {
        return static::where('is_active', true)
            ->get(['title', 'category', 'content']);
    }
}
