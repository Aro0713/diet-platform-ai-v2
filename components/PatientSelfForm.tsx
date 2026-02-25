// components/PatientSelfForm.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { tUI, type LangKey } from '@/utils/i18n';
import Link from 'next/link';

interface Props {
  lang: LangKey;
  value: any;
  onChange?: (updated: any) => void;
}

const SERIAL_RE = /^[A-Za-z0-9_-]{6,64}$/;

const ROBOT_MODELS: Array<{ value: string; labelKey: string; profile: string }> = [
  { value: 'cobbo', labelKey: 'kitchenRobotModelCobbo', profile: 'cobbo-tuya-v0' },
];

const PatientSelfForm: React.FC<Props> = ({ lang, value, onChange }) => {
  const [saving, setSaving] = useState(false);
  const [formSaved, setFormSaved] = useState(false);
  const [message, setMessage] = useState('');
  const [patient, setPatient] = useState({
    name: '',
    email: '',
    phone: '',
    sex: '',
    age: '',
    height: '',
    weight: '',
    region: '',
    assigned_doctor_email: '',

    // ✅ robot fields
    has_kitchen_robot: false,
    kitchen_robot_model: '',
    kitchen_robot_serial: '',
    kitchen_robot_profile: '',
  });

  useEffect(() => {
    if (value) {
      console.log("📥 PatientSelfForm otrzymał value:", value);

      setPatient({
        name: value.name || '',
        email: value.email || '',
        phone: value.phone || '',
        sex: value.sex || '',
        age: value.age?.toString() || '',
        height: value.height?.toString() || '',
        weight: value.weight?.toString() || '',
        region: value.region || '',
        assigned_doctor_email: value.assigned_doctor_email || '',

        has_kitchen_robot: Boolean(value.has_kitchen_robot),
        kitchen_robot_model: value.kitchen_robot_model || '',
        kitchen_robot_serial: value.kitchen_robot_serial || '',
        kitchen_robot_profile: value.kitchen_robot_profile || '',
      });
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPatient(prev => ({ ...prev, [name]: value }));
  };

  const handleRobotToggle = (checked: boolean) => {
    if (!checked) {
      setPatient(prev => ({
        ...prev,
        has_kitchen_robot: false,
        kitchen_robot_model: '',
        kitchen_robot_serial: '',
        kitchen_robot_profile: '',
      }));
      return;
    }
    setPatient(prev => ({ ...prev, has_kitchen_robot: true }));
  };

  const handleRobotModelChange = (model: string) => {
    const profile = ROBOT_MODELS.find(m => m.value === model)?.profile || '';
    setPatient(prev => ({
      ...prev,
      kitchen_robot_model: model,
      kitchen_robot_profile: profile,
    }));
  };

  const validateRobot = (): string | null => {
    if (!patient.has_kitchen_robot) return null;

    const model = String(patient.kitchen_robot_model || '').trim();
    const serial = String(patient.kitchen_robot_serial || '').trim();

    if (!model) return tUI('kitchenRobotModelRequired', lang);
    if (!serial) return tUI('kitchenRobotSerialRequired', lang);
    if (!SERIAL_RE.test(serial)) return tUI('kitchenRobotSerialInvalid', lang);

    return null;
  };

  const handleSave = async () => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('currentUserID') : null;
    if (!userId || !patient.email) {
      setMessage(tUI('saveError', lang));
      return;
    }

    const robotErr = validateRobot();
    if (robotErr) {
      setMessage(robotErr);
      return;
    }

    setSaving(true);
    setMessage('');

    const payload: any = {
      user_id: userId,
      ...patient,
      age: patient.age ? parseInt(patient.age) : null,
      height: patient.height ? parseInt(patient.height) : null,
      weight: patient.weight ? parseInt(patient.weight) : null,
      // ✅ enforce DB constraints cleanly
      has_kitchen_robot: Boolean(patient.has_kitchen_robot),
      kitchen_robot_model: patient.has_kitchen_robot ? (patient.kitchen_robot_model || null) : null,
      kitchen_robot_serial: patient.has_kitchen_robot ? (patient.kitchen_robot_serial || null) : null,
      kitchen_robot_profile: patient.has_kitchen_robot ? (patient.kitchen_robot_profile || 'cobbo-tuya-v0') : null,
      kitchen_robot_linked_at: patient.has_kitchen_robot ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from('patients')
      .upsert([payload], { onConflict: 'user_id' });

    if (error) {
      console.error('❌ Błąd zapisu danych pacjenta:', error.message);
      setMessage(tUI('saveError', lang));
    } else {
      setMessage(tUI('saveSuccess', lang));
      setFormSaved(true);
      if (onChange) onChange(payload); // ✅ wywołanie tylko po sukcesie zapisu
    }

    setSaving(false);
  };

  const [doctorList, setDoctorList] = useState<{ id: string; name: string; email: string }[]>([]);

  useEffect(() => {
    supabase
      .from('users')
      .select('id, name, email')
      .in('role', ['doctor', 'dietitian'])
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Błąd pobierania lekarzy:', error.message);
        } else {
          setDoctorList(data || []);
        }
      });
  }, []);

  const serialOk = !patient.has_kitchen_robot || SERIAL_RE.test(String(patient.kitchen_robot_serial || '').trim());

  return (
    <div className="w-full max-w-3xl mx-auto overflow-hidden space-y-4 px-4 sm:px-0">
      <h2 className="text-xl font-bold">{tUI('patientData', lang)}</h2>

      {/* Imię i nazwisko */}
      <input
        name="name"
        value={patient.name}
        onChange={handleChange}
        className="w-full min-w-0 h-[44px] px-4 rounded-md bg-white text-black placeholder-gray-500
                 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400
                 border border-gray-300 dark:border-gray-600
                 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
        placeholder={tUI('fullName', lang)}
      />

      {/* Email (read-only) */}
      <input
        name="email"
        value={patient.email}
        disabled
        className="w-full min-w-0 h-[44px] px-4 rounded-md bg-gray-100 text-gray-500
                 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
        placeholder="Email"
      />

      {/* Telefon */}
      <input
        name="phone"
        value={patient.phone}
        onChange={handleChange}
        className="w-full min-w-0 h-[44px] px-4 rounded-md bg-white text-black placeholder-gray-500
                 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400
                 border border-gray-300 dark:border-gray-600
                 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
        placeholder={tUI('phone', lang)}
      />

      {/* Prowadzący lekarz/dietetyk */}
      <div className="flex flex-col gap-1 min-w-0">
        <label htmlFor="assignedDoctor" className="text-sm font-medium text-white">
          {tUI('assignedDoctorLabel', lang)}
        </label>
        <select
          id="assignedDoctor"
          name="assigned_doctor_email"
          value={patient.assigned_doctor_email}
          onChange={handleChange}
          className="w-full min-w-0 h-[44px] text-sm bg-white dark:bg-gray-800 text-black dark:text-white
                   border border-gray-300 dark:border-gray-600 rounded px-3 focus:outline-none"
        >
          <option value="">{tUI('selectDoctorPrompt', lang)}</option>
          {doctorList.map((doc) => (
            <option key={doc.id} value={doc.email}>
              {doc.name} ({doc.email})
            </option>
          ))}
        </select>
      </div>

      {/* Płeć */}
      <select
        name="sex"
        value={patient.sex}
        onChange={handleChange}
        className="w-full min-w-0 h-[44px] px-4 rounded-md bg-white text-black
                 dark:bg-gray-800 dark:text-white
                 border border-gray-300 dark:border-gray-600
                 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
      >
        <option value="">{tUI('selectOption', lang)}</option>
        <option value="female">{tUI('female', lang)}</option>
        <option value="male">{tUI('male', lang)}</option>
        <option value="other">{tUI('other', lang)}</option>
      </select>

      {/* Wiek / Wzrost / Waga / Region */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 min-w-0">
        <input
          name="age"
          type="number"
          inputMode="numeric"
          value={patient.age}
          onChange={handleChange}
          className="w-full min-w-0 h-[44px] px-4 rounded-md bg-white text-black placeholder-gray-500
                   dark:bg-gray-800 dark:text-white dark:placeholder-gray-400
                   border border-gray-300 dark:border-gray-600
                   focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
          placeholder={tUI('age', lang)}
        />

        <input
          name="height"
          type="number"
          inputMode="decimal"
          value={patient.height}
          onChange={handleChange}
          className="w-full min-w-0 h-[44px] px-4 rounded-md bg-white text-black placeholder-gray-500
                   dark:bg-gray-800 dark:text-white dark:placeholder-gray-400
                   border border-gray-300 dark:border-gray-600
                   focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
          placeholder={tUI('height', lang)}
        />

        <input
          name="weight"
          type="number"
          inputMode="decimal"
          value={patient.weight}
          onChange={handleChange}
          className="w-full min-w-0 h-[44px] px-4 rounded-md bg-white text-black placeholder-gray-500
                   dark:bg-gray-800 dark:text-white dark:placeholder-gray-400
                   border border-gray-300 dark:border-gray-600
                   focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
          placeholder={tUI('weight', lang)}
        />

        <input
          name="region"
          value={patient.region}
          onChange={handleChange}
          className="w-full min-w-0 h-[44px] px-4 rounded-md bg-white text-black placeholder-gray-500
                   dark:bg-gray-800 dark:text-white dark:placeholder-gray-400
                   border border-gray-300 dark:border-gray-600
                   focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
          placeholder={tUI('region', lang)}
        />
      </div>

      {/* ✅ ROBOT KUCHENNY */}
      <div className="mt-4 p-4 rounded-xl bg-white/10 dark:bg-gray-900/30 border border-white/10">
        <div className="flex items-center gap-3">
          <input
            id="has_kitchen_robot"
            type="checkbox"
            checked={Boolean(patient.has_kitchen_robot)}
            onChange={(e) => handleRobotToggle(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="has_kitchen_robot" className="font-semibold">
            {tUI('kitchenRobotHas', lang)}
          </label>
        </div>

        {patient.has_kitchen_robot && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm opacity-90">{tUI('kitchenRobotModel', lang)}</label>
              <select
                value={patient.kitchen_robot_model}
                onChange={(e) => handleRobotModelChange(e.target.value)}
                className="w-full min-w-0 h-[44px] text-sm bg-white dark:bg-gray-800 text-black dark:text-white
                           border border-gray-300 dark:border-gray-600 rounded px-3 focus:outline-none"
              >
                <option value="">{tUI('kitchenRobotSelectModel', lang)}</option>
                {ROBOT_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {tUI(m.labelKey as any, lang)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm opacity-90">{tUI('kitchenRobotSerial', lang)}</label>
              <input
                value={patient.kitchen_robot_serial}
                onChange={(e) => setPatient(prev => ({ ...prev, kitchen_robot_serial: e.target.value }))}
                className="w-full min-w-0 h-[44px] px-4 rounded-md bg-white text-black placeholder-gray-500
                           dark:bg-gray-800 dark:text-white dark:placeholder-gray-400
                           border border-gray-300 dark:border-gray-600
                           focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                placeholder={tUI('kitchenRobotSerialPlaceholder', lang)}
              />
              {!serialOk && (
                <p className="text-xs text-amber-300">
                  {tUI('kitchenRobotSerialHint', lang)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Przyciski: Zapis / Płatność / Faktura */}
      <div className="mt-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <button
          onClick={handleSave}
          className="w-full sm:w-auto bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded transition disabled:opacity-50"
          disabled={saving}
        >
          {saving ? tUI('saving', lang) : tUI('save', lang)}
        </button>

        <div className="w-full sm:w-auto sm:ml-auto">
          {!value?.subscription_status || value.subscription_status === 'none' || value.subscription_status === 'expired' ? (
            <Link href="/payment">
              <button className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded shadow transition">
                💳 {tUI('goToPayment', lang) || 'Zapłać za plan diety'}
              </button>
            </Link>
          ) : value?.invoice_url ? (
            <a
              href={value.invoice_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded shadow transition"
            >
              📄 {tUI('downloadInvoice', lang) || 'Pobierz fakturę PDF'}
            </a>
          ) : null}
        </div>
      </div>

      {message && <p className="text-sm text-blue-600 mt-2">{message}</p>}
    </div>
  );
};

export default PatientSelfForm;