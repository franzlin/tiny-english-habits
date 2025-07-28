import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './useAuth.jsx';

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getProfile = useCallback(async () => {
    if (!user) {
        setLoading(false);
        return;
    };

    setLoading(true);
    setError(null);

    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, preferred_topic, preferred_lexile_level, streak, stats`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) { // 406 错误意味着没有找到行，对于新用户来说这是正常的
        throw error;
      }

      if (data) {
        setProfile(data);
      } else {
        // 这个情况处理的是一个还没有个人资料行的新用户。
        // 我们可以创建一个默认的 profile 对象供 UI 使用。
        setProfile({
            username: user.email,
            preferred_topic: 'Tech News',
            preferred_lexile_level: '800L-1000L',
            streak: 0,
            stats: { completions: [] }
        });
      }
    } catch (err) {
      console.error('获取个人资料时出错:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  const updateProfile = useCallback(async (updates) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // 在更新前检查个人资料是否存在
      const { data: existingProfile, error: selectError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') { // PGRST116: "未找到确切的一行"
          throw selectError;
      }

      let query;
      if (existingProfile) {
          // 个人资料存在，更新它
          query = supabase.from('profiles').update(updates).eq('id', user.id);
      } else {
          // 个人资料不存在，插入它
          const newProfile = { id: user.id, ...updates };
          query = supabase.from('profiles').insert(newProfile);
      }

      const { error } = await query;

      if (error) {
        // 在这里添加强制的、详细的错误日志
        console.error("!!! VERCEL PROFILE UPDATE FAILED !!!");
        console.error("Error Code:", error.code);
        console.error("Error Message:", error.message);
        console.error("Error Details:", error.details);
        console.error("Full Error Object:", error);
        throw error;
      }
      
      // 更新本地 state 以立即反映变化
      setProfile(prevProfile => ({ ...prevProfile, ...updates }));
      console.log('个人资料更新成功！');

    } catch (err) {
      console.error('更新个人资料时出错:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { profile, loading, error, updateProfile, refreshProfile: getProfile };
};