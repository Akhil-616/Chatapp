/**
 * Helper to derive college name from verified student email domain.
 * Per platform rules, college affiliation is derived automatically at signup
 * from the user's verified college email and is strictly read-only.
 */
export function getCollegeFromEmail(email) {
  if (!email || typeof email !== 'string') return 'Islington College Kathmandu';
  const clean = email.trim().toLowerCase();
  
  if (clean.endsWith('@islingtoncollege.edu.np')) {
    return 'Islington College Kathmandu';
  }
  
  if (clean.endsWith('@heraldcollege.edu.np')) {
    return 'Herald College Kathmandu';
  }
  
  if (clean.endsWith('@softwarica.edu.np')) {
    return 'Softwarica College Kathmandu';
  }

  return 'Islington College Kathmandu';
}

export const GENDER_OPTIONS = [
  'Male',
  'Female',
  'Other',
  'Prefer not to say'
];
