import { LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import InviteAcceptance from './components/InviteAcceptance';
import { Profile, isSupabaseConfigured, supabase } from './supabase';
import { App } from './App';
import { AuthPage } from './auth/AuthPage';
import { FirstAccessPassword } from './auth/FirstAccessPassword';
import { TeacherOnboarding } from './auth/TeacherOnboarding';
import { UpdatePassword } from './auth/UpdatePassword';
import { StudentPortal } from './student/StudentPortal';
import { TeacherPortal } from './teacher/TeacherPortal';

export default function AuthApp() {
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [demo, setDemo] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return query.get('password-recovery') === '1' || hash.get('type') === 'recovery';
  });

  // Check if we're accepting an invitation
  const params = new URLSearchParams(window.location.search);
  const invitationToken = params.get('token');
  const invitationEmail = params.get('email');

  // If accepting invitation, show invitation page
  if (invitationToken && invitationEmail) {
    return (
      <InviteAcceptance
        token={invitationToken}
        email={invitationEmail}
        onSuccess={() => {
          // After successful account creation, redirect to login
          window.location.href = '/';
        }}
        onError={(error) => {
          console.error('Invitation error:', error);
        }}
      />
    );
  }

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    const loadProfile = async () => {
      const { data: { user } } = await client.auth.getUser();
      if (!user) { setProfile(null); setAuthEmail(''); setLoading(false); return; }
      setAuthEmail(user.email ?? '');
      const { data } = await client.from('profiles').select('*').eq('id', user.id).single();
      if (!data) { setProfile(null); setLoading(false); return; }
      const metadata = user.user_metadata ?? {};
      setProfile({
        ...data,
        full_name: data.full_name || metadata.full_name || metadata.name || '',
        email: data.email || user.email || '',
        whatsapp_phone: data.whatsapp_phone || '',
        avatar_url: data.avatar_url || metadata.avatar_url || metadata.picture || '',
        school_name: data.school_name || '',
        onboarding_completed: Boolean(data.onboarding_completed),
      } as Profile);
      setLoading(false);
    };
    loadProfile();
    const { data } = client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      void loadProfile();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (loading) return <div className="auth-loading"><LoaderCircle className="spin" size={30} />Carregando sua conta...</div>;
  if (passwordRecovery) return <UpdatePassword onComplete={async () => {
    await supabase?.auth.signOut();
    window.history.replaceState({}, '', '/');
    setProfile(null);
    setAuthEmail('');
    setPasswordRecovery(false);
  }} />;
  if (demo) return <>
    <App onLogout={() => setDemo(false)} />
  </>;
  if (!profile) return <AuthPage onDemo={() => setDemo(true)} />;
  if (profile.role === 'student' && profile.must_change_password) return <FirstAccessPassword profile={profile} onComplete={() => setProfile({ ...profile, must_change_password: false })} onLogout={() => supabase?.auth.signOut()} />;
  if (profile.role === 'student') return <StudentPortal profile={profile} onLogout={() => supabase?.auth.signOut()} />;
  if (!profile.onboarding_completed) return <TeacherOnboarding profile={profile} authEmail={authEmail} onComplete={setProfile} onLogout={() => supabase?.auth.signOut()} />;
  return <TeacherPortal profile={profile} authEmail={authEmail} onProfileChange={setProfile} onLogout={() => supabase?.auth.signOut()} />;
}
