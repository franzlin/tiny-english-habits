import { createClient } from '@supabase/supabase-js';

// 从 .env.local 文件中获取环境变量
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 创建并导出 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey);