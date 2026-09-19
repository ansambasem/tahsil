<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['key' => 'company_name', 'value' => 'Water Authority', 'display_name' => 'اسم الجهة', 'category' => 'general', 'data_type' => 'string'],
            ['key' => 'currency', 'value' => 'SAR', 'display_name' => 'العملة', 'category' => 'general', 'data_type' => 'string'],
            ['key' => 'late_fee_percentage', 'value' => '0', 'display_name' => 'نسبة رسوم التأخير', 'category' => 'billing', 'data_type' => 'number'],
            ['key' => 'receipt_footer', 'value' => 'شكراً لتعاملكم معنا', 'display_name' => 'تذييل الإيصال', 'category' => 'receipt', 'data_type' => 'string'],
            ['key' => 'min_payment_amount', 'value' => '1', 'display_name' => 'الحد الأدنى للدفعة', 'category' => 'billing', 'data_type' => 'number'],
        ];

        foreach ($settings as $s) {
            Setting::firstOrCreate(['key' => $s['key']], $s);
        }
    }
}
