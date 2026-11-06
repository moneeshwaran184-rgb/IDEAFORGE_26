import { DemoAccountSwitcher } from './components/DemoAccountSwitcher';
import { SuperAdminNavbar } from './components/SuperAdminNavbar';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { ComplaintHeatMap } from './components/ComplaintHeatMap';
import { NotificationBell } from './components/NotificationBell';
import { CategoryPicker } from './components/CategoryPicker';
import { CityReportsPage } from './pages/CityReportsPage';
import { DepartmentNavbar } from './components/DepartmentNavbar';
import { MyReportsPage } from './pages/MyReportsPage';
import { DepartmentDashboard } from './components/DepartmentDashboard';
import { supabase } from './services/auth';
import { LoginPage } from './components/LoginPage';
import type { User } from '@supabase/supabase-js';
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ComplaintFormPage } from './pages/ComplaintFormPage';
import { SuggestionFormPage } from './pages/SuggestionFormPage';
import { TrackReportPage } from './pages/TrackReportPage';
import { ProfileModal } from './components/ProfileModal';
import { CivicService } from './services/civicService';
import { CivicReport, CityMetrics } from './types';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    try { const saved = localStorage.getItem('fmc-theme'); return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try { localStorage.setItem('fmc-theme', darkMode ? 'dark' : 'light'); } catch {}
  }, [darkMode]);
  const [categoryPicker,setCategoryPicker] = useState<'complaint'|'suggestion'|null>(null);
  const [adminTab,setAdminTab] = useState('overview');
  const [departmentTab,setDepartmentTab] = useState('complaint');
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [trackRefNumber, setTrackRefNumber] = useState<string | undefined>(undefined);

  const [reports, setReports] = useState<CivicReport[]>([]);
  const [metrics, setMetrics] = useState<CityMetrics>(CivicService.getCityMetrics());

  const [citizen, setCitizen] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCitizen(session?.user ?? null);
      setAuthReady(true); if (session) setCurrentView(view => view === 'login' ? 'home' : view);
    });
    return () => subscription.unsubscribe();
  }, []);

  const [isSuperAdmin,setIsSuperAdmin] = useState(false);
  const [department,setDepartment] = useState<string|null>(null);
  const [roleReady,setRoleReady] = useState(false);
  const [roleError,setRoleError] = useState('');
  const [roleAttempt,setRoleAttempt] = useState(0);
  useEffect(()=>{
    let alive=true;setDepartment(null);setIsSuperAdmin(false);setRoleReady(false);setRoleError('');
    if(!citizen){setRoleReady(true);return;}
    Promise.all([supabase.from('department_members').select('department_id').eq('user_id',citizen.id).maybeSingle(),supabase.from('super_admins').select('user_id').eq('user_id',citizen.id).maybeSingle()]).then(([deptResult,adminResult])=>{
      if(!alive)return;
      if(deptResult.error||adminResult.error){setRoleError('Account permissions could not load. Run the admin database setup, then retry.');return;}
      setDepartment(deptResult.data?.department_id||null);setIsSuperAdmin(!!adminResult.data);setRoleReady(true);
    });
    return()=>{alive=false;};
  },[citizen?.id,roleAttempt]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    refreshReports();
  }, []);

  const refreshReports = async () => {
    let list: CivicReport[]; try { list = await CivicService.refresh(); } catch { window.alert('Unable to load reports. Reload to retry.'); return; }
    setReports(list);
    setMetrics(CivicService.getCityMetrics());
  };

  const handleNavigate = (view: string, categoryId?: string) => {
    if ((view === 'complaint' || view === 'suggestion') && !categoryId) { setCategoryPicker(view); return; }
    setCurrentView(view);
    setSelectedCategoryId(categoryId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchTrack = (refNumber: string) => {
    setTrackRefNumber(refNumber);
    setCurrentView('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVote = async (reportId: string) => {
    const updated = await CivicService.toggleVote(reportId).catch(() => { window.alert('Unable to save vote. Please try again.'); return null; });
    if (updated) {
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, votes: updated.votes, userVoted: updated.userVoted } : r))
      );
      setMetrics(CivicService.getCityMetrics());
    }
  };

  const handleReportCreated = (newReport: CivicReport) => {
    refreshReports();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F4] dark:bg-[#151719] text-[#181615] dark:text-[#F4EFE6] font-sans selection:bg-[#EB4A26] selection:text-white">
      {categoryPicker && <CategoryPicker type={categoryPicker} onClose={()=>setCategoryPicker(null)} onSelect={id=>{handleNavigate(categoryPicker,id);setCategoryPicker(null);}}/>}
      {/* Top Navbar */}
      {(!citizen || (roleReady && !department && !isSuperAdmin && !isSuperAdmin)) ? (      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        userProfile={{ name: citizen?.user_metadata?.display_name || citizen?.email || 'Guest', isDemoUser: !citizen }}
        onToggleProfileModal={() => citizen ? setIsProfileModalOpen(true) : setCurrentView('login')}
      />) : citizen && roleReady && isSuperAdmin ? <SuperAdminNavbar tab={adminTab} onTab={setAdminTab}/> : <DepartmentNavbar tab={departmentTab} onTab={setDepartmentTab} onAccount={()=>setIsProfileModalOpen(true)}/>}

      {/* Main Content Area */}
      <main className="flex-1">
        <div className="flex flex-wrap justify-end items-center gap-3 px-6 py-3 border-b"><button type="button" aria-pressed={darkMode} onClick={() => setDarkMode(value => !value)} className="px-4 py-2 border rounded-lg font-bold">{darkMode ? 'Light mode' : 'Dark mode'}</button>
          {authReady && <DemoAccountSwitcher activeEmail={citizen?.email||''}/>}
          {!authReady ? <span>Checking login…</span> : citizen ? <>
        {citizen && roleReady && !department && !isSuperAdmin && <NotificationBell key={citizen.id} userId={citizen.id} onOpen={async(id)=>{
          const {data,error}=await supabase.from('reports').select('reference_number').eq('id',id).single();
          if(error){window.alert('Unable to open report. Please try again.');throw error;}
          await refreshReports();handleSearchTrack(data.reference_number);
        }}/>}
            <span className="text-sm truncate">{citizen.email}</span>
            <button className="font-bold underline" onClick={async () => { const { error } = await supabase.auth.signOut(); if (error) window.alert(error.message); }}>Log out</button>
          </> : <button className="px-5 py-2 bg-[#181615] text-white rounded-lg" onClick={() => setCurrentView('login')}>Log in / Sign up</button>}
        </div>
        {authReady && !citizen && ['login', 'complaint', 'suggestion', 'my-reports'].includes(currentView) && <LoginPage />}
        {(!citizen || (roleReady && !department && !isSuperAdmin && !isSuperAdmin)) && currentView === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            reports={citizen ? reports.filter(r => r.citizenId === citizen.id) : reports}
            mapReports={reports}
            metrics={metrics}
            onVote={handleVote}
            onSearchTrack={handleSearchTrack}
          />
        )}

        {currentView === 'complaint' && citizen && roleReady && !department && !isSuperAdmin && (
          <ComplaintFormPage
            initialCategoryId={selectedCategoryId}
            onNavigateToTrack={handleSearchTrack}
            onReportCreated={handleReportCreated}
          />
        )}

        {currentView === 'suggestion' && citizen && roleReady && !department && !isSuperAdmin && (
          <SuggestionFormPage
            initialCategoryId={selectedCategoryId}
            onNavigateToTrack={handleSearchTrack}
            onReportCreated={handleReportCreated}
          />
        )}

        {!department && !isSuperAdmin && roleReady && currentView === 'track' && (
          <TrackReportPage
            initialRefNumber={trackRefNumber}
            reports={reports}
            onVote={handleVote}
            onNavigateToForm={(type) => handleNavigate(type)}
          />
        )}
        {citizen && !roleReady && <div className="p-6">{roleError ? <><p role="alert">{roleError}</p><button className="underline" onClick={()=>setRoleAttempt(n=>n+1)}>Retry</button></> : 'Loading account permissions…'}</div>}
        {citizen && roleReady && isSuperAdmin && <SuperAdminDashboard tab={adminTab}/>}
        {citizen && roleReady && !isSuperAdmin && department && <DepartmentDashboard key={citizen.id+department} department={department} tab={departmentTab}/>}

        {citizen && roleReady && !department && !isSuperAdmin && currentView === 'my-reports' && <MyReportsPage key={citizen.id} userId={citizen.id} onTrack={async(ref)=>{await refreshReports();handleSearchTrack(ref);}}/>}
        {!department && !isSuperAdmin && roleReady && currentView === 'heat-map' && <ComplaintHeatMap reports={reports} fullScreen onNavigate={()=>handleNavigate('home')} />}
        {!department && !isSuperAdmin && roleReady && currentView === 'city-reports' && <CityReportsPage onTrack={async(ref)=>{await refreshReports();handleSearchTrack(ref);}}/>}
      </main>

      {/* Footer */}
      {!department && !isSuperAdmin && roleReady && <Footer onNavigate={handleNavigate} />}

      {/* Resident Profile / Settings Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen && !!citizen}
        onClose={() => setIsProfileModalOpen(false)}
        name={citizen?.user_metadata?.display_name || citizen?.email?.split('@')[0] || ''}
        email={citizen?.email || ''}
      />
    </div>
  );
}















