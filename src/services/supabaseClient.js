import { createClient } from '@supabase/supabase-js';

// Idealmente, estas claves irán en un archivo .env oculto en el futuro
const SUPABASE_URL = 'https://qykubittvlwsavrhljek.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5a3ViaXR0dmx3c2F2cmhsamVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMTY1ODUsImV4cCI6MjA5NjU5MjU4NX0.5vcZXG7qTAqVO87EChPbQVIDeVvmNuBCrjIUddySMzk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);