import { supabase } from './supabaseClient';

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    console.error('Błąd podczas rejestracji:', error.message);
    throw new Error(error.message);
  }

  return data;
}
