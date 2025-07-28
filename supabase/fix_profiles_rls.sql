-- =================================================================
-- 'profiles' 表安全策略修复脚本 (可安全重复运行)
-- =================================================================

-- 步骤 1: 确保 'profiles' 表启用了行级安全 (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 步骤 2: 删除可能存在的旧策略，以便重新创建
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

-- 步骤 3: 创建正确的“读取”策略
CREATE POLICY "Users can view their own profile."
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 步骤 4: 创建正确的“更新”策略
CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);