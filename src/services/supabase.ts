import { validateTamilNadu } from './location';
import { supabase } from './auth';
import { CivicReport } from '../types';
const env = (import.meta as unknown as { env: Record<string, string> }).env;
export async function cloudReports(query = '', method = 'GET', body?: unknown): Promise<CivicReport[]> {
  const { data: { session } } = await supabase.auth.getSession(); if (method === 'POST' && !session) throw new Error('Please log in to submit.');
  const response = await fetch(env.VITE_SUPABASE_URL + '/rest/v1/reports' + query, {
    method,
    headers: { ...(session ? { Authorization: 'Bearer ' + session.access_token } : {}), apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error('Unable to access reports. Check your connection and database setup.');
  return (await response.json()).map((row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).map(([k,v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v])) as unknown as CivicReport);
}
export async function createCloudReport(report: CivicReport) {
  const {data:{user},error:authError} = await supabase.auth.getUser(); if(authError || !user) throw new Error('Please log in again before submitting.');
  report = {...report,citizenId:user.id};
  const district = await validateTamilNadu(report.location.lat, report.location.lng); report = { ...report, location: { ...report.location, area: district } };
  const { contactName, contactPhone, contactEmail, userVoted, ...publicReport } = report;
  const body = Object.fromEntries(Object.entries(publicReport).map(([k,v]) => [k.replace(/[A-Z]/g, c => '_' + c.toLowerCase()), v]));
  const saved = (await cloudReports('', 'POST', body))[0];
  if (!saved || saved.citizenId !== user.id) throw new Error('The report was saved, but account ownership is missing. Do not resubmit. Ask the project owner to run repair-citizen-workflow.sql.');
  return saved;
}







