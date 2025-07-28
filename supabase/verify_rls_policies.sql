-- =================================================================
-- 数据库安全策略检查脚本 (只读，无任何修改)
-- =================================================================

-- 只查询 'profiles' 表上具体的安全策略
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