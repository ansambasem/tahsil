<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\AreaController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\MeterController;
use App\Http\Controllers\TariffController;
use App\Http\Controllers\WeekController;
use App\Http\Controllers\ReadingController;
use App\Http\Controllers\ChargeController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ReceiptController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\SettingController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::get('/auth/roles', [AuthController::class, 'roles']);
    Route::get('/auth/permissions', [AuthController::class, 'permissions']);
    Route::get('/auth/role-permissions/{roleId}', [AuthController::class, 'rolePermissions']);
    Route::put('/auth/role-permissions/{roleId}', [AuthController::class, 'updateRolePermissions']);
    Route::get('/auth/users', [AuthController::class, 'users']);
    Route::post('/auth/users', [AuthController::class, 'createUser']);
    Route::put('/auth/users/{id}', [AuthController::class, 'updateUser']);
    Route::delete('/auth/users/{id}', [AuthController::class, 'deleteUser']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // Branches
    Route::get('/branches', [BranchController::class, 'index']);
    Route::post('/branches', [BranchController::class, 'store'])->middleware('permission:branches.create');
    Route::put('/branches/{id}', [BranchController::class, 'update'])->middleware('permission:branches.update');
    Route::delete('/branches/{id}', [BranchController::class, 'destroy'])->middleware('permission:branches.delete');

    // Areas
    Route::get('/areas', [AreaController::class, 'index']);
    Route::post('/areas', [AreaController::class, 'store'])->middleware('permission:areas.create');
    Route::put('/areas/{id}', [AreaController::class, 'update'])->middleware('permission:areas.update');
    Route::delete('/areas/{id}', [AreaController::class, 'destroy'])->middleware('permission:areas.delete');

    // Customers
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store'])->middleware('permission:customers.create');
    Route::put('/customers/{id}', [CustomerController::class, 'update'])->middleware('permission:customers.update');
    Route::delete('/customers/{id}', [CustomerController::class, 'destroy'])->middleware('permission:customers.delete');

    // Meters
    Route::get('/meters', [MeterController::class, 'index']);
    Route::post('/meters', [MeterController::class, 'store'])->middleware('permission:meters.create');
    Route::put('/meters/{id}', [MeterController::class, 'update'])->middleware('permission:meters.update');
    Route::delete('/meters/{id}', [MeterController::class, 'destroy'])->middleware('permission:meters.delete');
    Route::get('/meters/{id}/replacements', [MeterController::class, 'replacements']);
    Route::post('/meters/{id}/replace', [MeterController::class, 'replace'])->middleware('permission:meters.replace');

    // Tariffs
    Route::get('/tariffs', [TariffController::class, 'index']);
    Route::post('/tariffs', [TariffController::class, 'store'])->middleware('permission:tariffs.create');
    Route::put('/tariffs/{id}', [TariffController::class, 'update'])->middleware('permission:tariffs.update');
    Route::delete('/tariffs/{id}', [TariffController::class, 'destroy'])->middleware('permission:tariffs.delete');

    // Weeks
    Route::get('/weeks', [WeekController::class, 'index']);
    Route::post('/weeks', [WeekController::class, 'store'])->middleware('permission:weeks.create');
    Route::post('/weeks/{id}/close', [WeekController::class, 'close'])->middleware('permission:weeks.close');
    Route::post('/weeks/{id}/reopen', [WeekController::class, 'reopen'])->middleware('permission:weeks.reopen');

    // Readings
    Route::get('/readings', [ReadingController::class, 'index']);
    Route::post('/readings', [ReadingController::class, 'store'])->middleware('permission:readings.create');
    Route::put('/readings/{id}', [ReadingController::class, 'update'])->middleware('permission:readings.update');

    // Charges
    Route::get('/charges', [ChargeController::class, 'index']);
    Route::get('/charges/unpaid', [ChargeController::class, 'unpaid']);
    Route::post('/charges/generate', [ChargeController::class, 'generate'])->middleware('permission:charges.generate');

    // Payments
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::post('/payments', [PaymentController::class, 'store'])->middleware('permission:payments.create');
    Route::post('/payments/{id}/reverse', [PaymentController::class, 'reverse'])->middleware('permission:payments.reverse');

    // Receipts
    Route::get('/receipts', [ReceiptController::class, 'index']);
    Route::post('/receipts/{id}/reprint', [ReceiptController::class, 'reprint'])->middleware('permission:receipts.reprint');

    // Reports
    Route::get('/reports/payments', [ReportController::class, 'payments'])->middleware('permission:reports.view');
    Route::get('/reports/charges', [ReportController::class, 'charges'])->middleware('permission:reports.view');

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats'])->middleware('permission:dashboard.view');
    Route::get('/dashboard/latest-payments', [DashboardController::class, 'latestPayments'])->middleware('permission:dashboard.view');
    Route::get('/dashboard/branch-collection', [DashboardController::class, 'branchCollection'])->middleware('permission:dashboard.view');

    // Audit
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->middleware('permission:audit_logs.view');

    // Settings
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings/{key}', [SettingController::class, 'update'])->middleware('permission:settings.update');
});
