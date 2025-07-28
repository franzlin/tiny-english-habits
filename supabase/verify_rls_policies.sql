-- =================================================================
-- 数据库安全策略检查脚本 (只读，无任何修改)
-- =================================================================

-- 查询 1: 检查 'profiles' 和 'review_items' 表是否已启用行级安全(RLS)
-- 预期结果: 两行的 "rls_enabled" 都应该是 true
SELECT
    relname AS table_name,
    relrowsecurity AS rls_enabled
FROM
    pg_class
WHERE
    relname IN ('profiles', 'review_items');


-- 查询 2: 检查 'profiles' 表上具体的安全策略
-- 预期结果: 应该能看到 "Users can view their own profile." 和 "Users can update their own profile." 这两条策略
SELECT
    p.polname AS policy_name,
    p.polcmd AS command_type,
    pg_get_expr(p.polqual, p.polrelid) AS security_condition
FROM
    pg_policy p
JOIN
    pg_class c ON c.oid = p.polrelid
WHERE
    c.relname = 'profiles';


-- 查询 3: 检查 'review_items' 表上具体的安全策略
-- 预期结果: 应该能看到 "Users can manage their own review items." 这条策略
SELECT
    p.polname AS policy_name,
    p.polcmd AS command_type,
    pg_get_expr(p.polqual, p.polrelid) AS security_condition
FROM
    pg_policy p
JOIN
    pg_class c ON c.oid = p.polrelid
WHERE
    c.relname = 'review_items';