-- =================================================================
-- 'profiles' 表安全策略修复脚本
-- =================================================================

-- 步骤 1: 确保 'profiles' 表启用了行级安全 (RLS)
-- 如果已经启用，此命令不会产生任何影响。
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 步骤 2: 删除可能存在的旧的、不正确的策略（作为安全措施）
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

-- 步骤 3: 创建正确的“读取”策略
-- 允许用户读取自己的个人资料
CREATE POLICY "Users can view their own profile."
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 步骤 4: 创建正确的“更新”策略
-- 允许用户更新自己的个人资料
CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- =================================================================
-- 修复完成。现在 'profiles' 表应该有正确的安全策略了。
-- =================================================================