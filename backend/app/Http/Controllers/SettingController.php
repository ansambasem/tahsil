<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        return response()->json(Setting::orderBy('category')->orderBy('key')->get()->toArray());
    }

    public function update(Request $request, string $key)
    {
        $request->validate(['value' => 'nullable|string']);
        $setting = Setting::where('key', $key)->firstOrFail();
        $setting->update([
            'value' => $request->value,
            'updated_by' => $request->user()?->id,
        ]);
        return response()->json(['success' => true]);
    }
}
