import { createClient } from '@supabase/supabase-js';

/**
 * Quiviex Supabase Service
 * Connected to project: ulkabycvuxyrwtkbwhid
 */

const supabaseUrl = 'https://ulkabycvuxyrwtkbwhid.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsa2FieWN2dXh5cnd0a2J3aGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTcyMDgsImV4cCI6MjA4MzEzMzIwOH0.MOykuLttVnbsWoC4ZvS7PW4XXlnvE5u_zEnekRr0xRw';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Connection Health Check
 * Verifies if the schema is ready for the app.
 */
export const checkSupabaseConnection = async () => {
  try {
    // Check if we can reach the quizzes table
    const { error } = await supabase.from('quizzes').select('id').limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        return { connected: false, error: "The 'quizzes' table does not exist. Please run the SQL setup script in Supabase." };
      }
      if (error.code === '42703') {
        return { connected: false, error: "Schema mismatch: A required column (like 'visibility') is missing. Please run the Repair Script." };
      }
      throw error;
    }
    
    return { connected: true, error: null };
  } catch (err: any) {
    console.error("Supabase Connection Failed:", err.message);
    return { connected: false, error: err.message };
  }
};