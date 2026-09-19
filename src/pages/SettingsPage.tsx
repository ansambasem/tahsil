import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { showToast, LoadingState } from '@/components/ui';
import { Save, Settings as SettingsIcon } from 'lucide-react';
import type { Setting } from '@/lib/types';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(editedValues);
      for (const [key, value] of entries) {
        await api.updateSetting(key, value);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      showToast('success', 'تم حفظ الإعدادات');
      setEditedValues({});
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  if (isLoading) return <LoadingState />;

  const grouped = (settings || []).reduce<Record<string, Setting[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  const categoryLabels: Record<string, string> = {
    general: 'عام', receipt: 'الإيصالات', payments: 'المدفوعات',
  };

  function getValue(s: Setting) {
    return editedValues[s.key] !== undefined ? editedValues[s.key] : s.value || '';
  }

  return (
    <div>
      <PageHeader title="الإعدادات" subtitle="إعدادات النظام" actions={
        <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending || Object.keys(editedValues).length === 0} className="btn-primary">
          <Save className="w-4 h-4" /> حفظ التغييرات
        </button>
      } />

      <div className="space-y-6">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="card p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-primary-600" />
              {categoryLabels[category] || category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((s) => (
                <div key={s.id}>
                  <label className="label">{s.display_name}</label>
                  {s.data_type === 'boolean' ? (
                    <select
                      className="input"
                      value={getValue(s)}
                      onChange={(e) => setEditedValues({ ...editedValues, [s.key]: e.target.value })}
                    >
                      <option value="true">نعم</option>
                      <option value="false">لا</option>
                    </select>
                  ) : (
                    <input
                      className="input"
                      value={getValue(s)}
                      onChange={(e) => setEditedValues({ ...editedValues, [s.key]: e.target.value })}
                    />
                  )}
                  {s.notes && <p className="text-xs text-slate-400 mt-1">{s.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
