import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// 定义CORS头，允许任何来源的请求（在开发中最简单，生产中可收紧）
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// DashScope API 的地址
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

serve(async (req) => {
  // 专门处理浏览器的 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. 从前端请求中解析出要合成的文本和语速
    const { text, speech_rate } = await req.json();
    if (!text) {
      throw new Error("请求体中缺少 'text' 字段。");
    }

    // 2. 从 Supabase 的安全环境变量中获取密钥
    const dashscopeApiKey = Deno.env.get("DASHSCOPE_API_KEY");
    if (!dashscopeApiKey) {
      throw new Error("未在 Supabase 后台配置 DASHSCOPE_API_KEY。");
    }

    // 3. 向阿里云发起请求
    const response = await fetch(DASHSCOPE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dashscopeApiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'enable',
      },
      body: JSON.stringify({
        model: "qwen-tts",
        input: { text },
        parameters: {
          voice: "Chelsie",
          speed: speech_rate ?? 0, // 如果前端未提供，则默认为0
        }
      }),
    });

    if (!response.ok || !response.body) {
      const errorBody = await response.text();
      throw new Error(`DashScope API 错误: ${errorBody}`);
    }

    // 4. 处理从阿里云返回的流式数据，并找到最终的音频URL
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const jsonData = line.substring(5).trim();
          if (jsonData) {
            const parsedData = JSON.parse(jsonData);
            // [最终修复] 使用正确的成功条件和URL路径
            if (parsedData.output && parsedData.output.finish_reason === 'stop' && parsedData.output.audio?.url) {
              // 5. 成功找到URL，将其返回给前端
              return new Response(
                JSON.stringify({ audio_url: parsedData.output.audio.url }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
            if (parsedData.output && parsedData.output.task_status === 'FAILED') {
              throw new Error(`DashScope 任务失败: ${parsedData.output.message}`);
            }
          }
        }
      }
    }

    throw new Error("在 DashScope 响应流中未找到音频 URL。");

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});