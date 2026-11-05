import React, { useState } from 'react';
import { supabase } from '../services/auth';
export function LoginPage() {
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      const { data, error } = signup
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session) setMessage('Check your email to confirm your account, then return here to log in.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to log in. Please try again.'); }
    finally { setBusy(false); }
  }
  return <section className="max-w-md mx-auto my-12 p-8 bg-white dark:bg-[#22262B] border-2 border-[#181615] dark:border-[#737B85] rounded-2xl">
    <h1 className="text-2xl font-bold">{signup ? 'Create citizen account' : 'Citizen login'}</h1>
    <p className="my-4">Log in to submit a report or suggestion.</p>
    <form onSubmit={submit} className="space-y-4">
      <label className="block">Email<input autoFocus required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="block w-full border rounded p-3" /></label>
      <label className="block">Password<input required minLength={signup ? 8 : 1} type="password" autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} className="block w-full border rounded p-3" /></label>
      {message && <p role="status">{message}</p>}
      <button disabled={busy} className="w-full bg-[#EB4A26] text-white rounded p-3 disabled:opacity-50">{busy ? 'Please wait…' : signup ? 'Create account' : 'Log in'}</button>
      <button type="button" disabled={busy} onClick={() => { setSignup(!signup); setMessage(''); }} className="underline">{signup ? 'Already registered? Log in' : 'New citizen? Create account'}</button>
    </form>
  </section>;
}

