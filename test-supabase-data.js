// Quick test script to check Supabase data
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lbjuwltfpwxzhwjdlkny.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxianV3bHRmcHd4emh3amRsa255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODQ2NDAsImV4cCI6MjA3NjQ2MDY0MH0.4K1pq3h6TvvZ2FLe_uIhz0oPt7Bx-pyatt3FprO-ug4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('🔍 Checking Supabase data for chris320211@gmail.com...\n');

  // Check users table
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'chris320211@gmail.com');

  if (usersError) {
    console.log('❌ Error checking users:', usersError.message);
  } else if (users && users.length > 0) {
    console.log('✅ User found:');
    console.log(JSON.stringify(users[0], null, 2));

    const userId = users[0].id;

    // Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId);

    if (!profileError && profile && profile.length > 0) {
      console.log('\n✅ User profile found:');
      console.log(JSON.stringify(profile[0], null, 2));
    } else {
      console.log('\n⚠️  No user profile found');
    }

    // Check saved internships
    const { data: saved, error: savedError } = await supabase
      .from('saved_internships')
      .select('*')
      .eq('user_id', userId);

    if (!savedError && saved) {
      console.log(`\n✅ Saved internships: ${saved.length} found`);
      if (saved.length > 0) {
        console.log(JSON.stringify(saved.slice(0, 3), null, 2));
      }
    }
  } else {
    console.log('⚠️  No user found with email chris320211@gmail.com');
  }

  // Check session-based preferences
  console.log('\n📊 Checking all user preferences sessions:');
  const { data: prefs, error: prefsError } = await supabase
    .from('user_preferences_session')
    .select('*');

  if (prefsError) {
    console.log('❌ Error:', prefsError.message);
  } else if (prefs && prefs.length > 0) {
    console.log(`✅ Found ${prefs.length} preference sessions`);
    prefs.forEach(pref => {
      console.log(`\nSession: ${pref.session_id.substring(0, 30)}...`);
      console.log(`  - Job types: ${pref.preferred_job_types}`);
      console.log(`  - Year: ${pref.eligible_year}`);
      console.log(`  - Onboarding: ${pref.has_completed_onboarding}`);
    });
  } else {
    console.log('⚠️  No preferences found yet');
  }
}

checkData().then(() => {
  console.log('\n✅ Check complete!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
