<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Area;
use App\Models\Tariff;
use App\Models\TariffSlab;
use Illuminate\Database\Seeder;

class ReferenceDataSeeder extends Seeder
{
    public function run(): void
    {
        $branch = Branch::firstOrCreate(
            ['branch_code' => 'BR-001'],
            ['branch_name' => 'الفرع الرئيسي', 'status' => 'active', 'phone' => '0112345678']
        );

        Area::firstOrCreate(
            ['branch_id' => $branch->id, 'area_code' => 'AR-001'],
            ['area_name' => 'المنطقة الشمالية', 'status' => 'active']
        );
        Area::firstOrCreate(
            ['branch_id' => $branch->id, 'area_code' => 'AR-002'],
            ['area_name' => 'المنطقة الجنوبية', 'status' => 'active']
        );

        $residential = Tariff::firstOrCreate(
            ['tariff_code' => 'TF-RES-001'],
            [
                'tariff_name' => 'تعرفة سكنية',
                'subscription_type' => 'residential',
                'effective_from' => '2024-01-01',
                'effective_to' => null,
                'status' => 'active',
            ]
        );
        if ($residential->slabs()->count() === 0) {
            TariffSlab::create(['tariff_id' => $residential->id, 'from_units' => 0, 'to_units' => 10, 'rate_per_unit' => 0.5, 'fixed_charge' => 5]);
            TariffSlab::create(['tariff_id' => $residential->id, 'from_units' => 10, 'to_units' => 30, 'rate_per_unit' => 1.0, 'fixed_charge' => 0]);
            TariffSlab::create(['tariff_id' => $residential->id, 'from_units' => 30, 'to_units' => null, 'rate_per_unit' => 1.5, 'fixed_charge' => 0]);
        }

        $commercial = Tariff::firstOrCreate(
            ['tariff_code' => 'TF-COM-001'],
            [
                'tariff_name' => 'تعرفة تجارية',
                'subscription_type' => 'commercial',
                'effective_from' => '2024-01-01',
                'effective_to' => null,
                'status' => 'active',
            ]
        );
        if ($commercial->slabs()->count() === 0) {
            TariffSlab::create(['tariff_id' => $commercial->id, 'from_units' => 0, 'to_units' => 20, 'rate_per_unit' => 1.5, 'fixed_charge' => 10]);
            TariffSlab::create(['tariff_id' => $commercial->id, 'from_units' => 20, 'to_units' => 100, 'rate_per_unit' => 2.0, 'fixed_charge' => 0]);
            TariffSlab::create(['tariff_id' => $commercial->id, 'from_units' => 100, 'to_units' => null, 'rate_per_unit' => 3.0, 'fixed_charge' => 0]);
        }
    }
}
