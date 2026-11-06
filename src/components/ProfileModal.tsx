import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../services/auth';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  email: string;
}

export function ProfileModal({ isOpen, onClose, name: initialName, email }: ProfileModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (isOpen) { setName(initialName); setError(''); dialog.current?.showModal(); }
    else dialog.current?.close();
  }, [isOpen, initialName]);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const { error } = await supabase.auth.updateUser({ data: { display_name: name.trim() } });
      if (error) throw error;
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save your name.'); }
    finally { setBusy(false); }
  }
  return <dialog ref={dialog} onCancel={onClose} onClose={onClose} aria-labelledby="profile-title"
    className="m-auto w-[calc(100%-2rem)] max-w-md p-7 bg-[#FAF7F0] dark:bg-[#1E2125] border-2 border-[#181615] dark:border-[#737B85] rounded-3xl backdrop:bg-black/50">
    <button onClick={onClose} aria-label="Close account settings" className="absolute right-4 top-4 p-2"><X size={18}/></button>
    <h2 id="profile-title" className="text-2xl font-bold mb-2">Your account</h2>
    <p className="text-sm text-[#665F57] dark:text-[#BBB3A7] mb-6">Choose the location of each problem when you report it.</p>
    <form onSubmit={save} className="space-y-4">
      <label className="block text-sm font-bold">Email
        <input readOnly value={email} className="mt-1 block w-full rounded-xl border p-3 bg-[#EFE8DC] dark:bg-[#30363D]" />
      </label>
      <label className="block text-sm font-bold">Display name
        <input required maxLength={80} autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-xl border-2 border-[#181615] dark:border-[#737B85] p-3" />
      </label>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <button disabled={busy || !name.trim()} className="px-5 py-3 bg-[#EB4A26] text-white font-bold rounded-xl disabled:opacity-50">{busy ? 'Saving…' : 'Save changes'}</button>
    </form>
  </dialog>;
}

