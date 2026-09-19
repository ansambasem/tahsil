<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'غير مصرح'], 401);
        }

        if ($user->hasPermission($permission)) {
            return $next($request);
        }

        return response()->json(['error' => 'صلاحيات غير كافية'], 403);
    }
}
