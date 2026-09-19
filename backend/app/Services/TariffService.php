<?php

namespace App\Services;

use App\Models\Tariff;
use App\Models\TariffSlab;
use Illuminate\Support\Facades\DB;

class TariffService
{
    public function listTariffs()
    {
        return Tariff::with('slabs')->orderBy('created_at', 'desc')->get()->map(function ($t) {
            return $this->formatTariff($t);
        })->toArray();
    }

    public function createTariff(array $data)
    {
        return DB::transaction(function () use ($data) {
            $tariff = Tariff::create([
                'tariff_name' => $data['tariff_name'],
                'tariff_code' => $data['tariff_code'],
                'subscription_type' => $data['subscription_type'],
                'effective_from' => $data['effective_from'],
                'effective_to' => $data['effective_to'] ?? null,
                'status' => $data['status'] ?? 'active',
                'notes' => $data['notes'] ?? null,
                'created_by' => request()->user()?->id,
            ]);
            foreach ($data['slabs'] ?? [] as $slab) {
                TariffSlab::create([
                    'tariff_id' => $tariff->id,
                    'from_units' => $slab['from_units'],
                    'to_units' => $slab['to_units'] ?? null,
                    'rate_per_unit' => $slab['rate_per_unit'],
                    'fixed_charge' => $slab['fixed_charge'],
                ]);
            }
            return $this->formatTariff($tariff->fresh('slabs'));
        });
    }

    public function updateTariff(string $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $tariff = Tariff::findOrFail($id);
            $tariff->update([
                'tariff_name' => $data['tariff_name'] ?? $tariff->tariff_name,
                'tariff_code' => $data['tariff_code'] ?? $tariff->tariff_code,
                'subscription_type' => $data['subscription_type'] ?? $tariff->subscription_type,
                'effective_from' => $data['effective_from'] ?? $tariff->effective_from,
                'effective_to' => $data['effective_to'] ?? $tariff->effective_to,
                'status' => $data['status'] ?? $tariff->status,
                'notes' => $data['notes'] ?? $tariff->notes,
                'updated_by' => request()->user()?->id,
            ]);
            if (isset($data['slabs'])) {
                TariffSlab::where('tariff_id', $tariff->id)->delete();
                foreach ($data['slabs'] as $slab) {
                    TariffSlab::create([
                        'tariff_id' => $tariff->id,
                        'from_units' => $slab['from_units'],
                        'to_units' => $slab['to_units'] ?? null,
                        'rate_per_unit' => $slab['rate_per_unit'],
                        'fixed_charge' => $slab['fixed_charge'],
                    ]);
                }
            }
            return $this->formatTariff($tariff->fresh('slabs'));
        });
    }

    public function deleteTariff(string $id): void
    {
        Tariff::findOrFail($id)->delete();
    }

    private function formatTariff($t): array
    {
        return [
            'id' => $t->id,
            'tariff_name' => $t->tariff_name,
            'tariff_code' => $t->tariff_code,
            'subscription_type' => $t->subscription_type,
            'effective_from' => $t->effective_from?->format('Y-m-d'),
            'effective_to' => $t->effective_to?->format('Y-m-d'),
            'status' => $t->status,
            'notes' => $t->notes,
            'tariff_slabs' => $t->slabs->map(fn ($s) => [
                'id' => $s->id,
                'tariff_id' => $s->tariff_id,
                'from_units' => (float) $s->from_units,
                'to_units' => $s->to_units !== null ? (float) $s->to_units : null,
                'rate_per_unit' => (float) $s->rate_per_unit,
                'fixed_charge' => (float) $s->fixed_charge,
            ])->toArray(),
            'created_at' => $t->created_at,
            'updated_at' => $t->updated_at,
        ];
    }
}
