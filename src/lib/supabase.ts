import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wyxovxcjsndzrsxswztt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5eG92eGNqc25kenJzeHN3enR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3Mjc3MTEsImV4cCI6MjEwNTMwMzcxMX0.h7JWq4xrHWVTDvPMeD27nX-1ydGOSwJ2lpXAQmgxpKE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);