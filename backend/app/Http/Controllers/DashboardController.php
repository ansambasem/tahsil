<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        return response()->json(app(DashboardService::class)->getStats($request->week_id));
    }

    public function latestPayments()
    {
        return response()->json(app(DashboardService::class)->getLatestPayments());
    }

    public function branchCollection(Request $request)
    {
        return response()->json(app(DashboardService::class)->getBranchCollection($request->week_id));
    }
}
