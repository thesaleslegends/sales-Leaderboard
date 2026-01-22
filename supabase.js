// supabase.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔑 Supabase gegevens
const SUPABASE_URL = "https://vvxjeipsrtndohvfxnvb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eGplaXBzcnRuZG9odmZ4bnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NTE0ODIsImV4cCI6MjA4NDIyNzQ4Mn0.5UwRJC-XR7-KggeL9Kx9FikVIYSK_9u7mRAGEjAXFTQ";

// 🔌 Client maken
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
