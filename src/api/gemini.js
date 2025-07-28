// --- 新增：智能密钥管理器 ---

/**
 * 从环境变量中读取所有可用的 Gemini API 密钥
 * @returns {string[]} 一个包含所有有效密钥的数组
 */
function getAvailableApiKeys() {
  console.log("开始查找可用的 Gemini API 密钥...");
  const keys = [];
  // 循环检查 VITE_GEMINI_API_KEY_1, VITE_GEMINI_API_KEY_2, ...
  for (let i = 1; i <= 10; i++) { // 最多支持10个备用密钥
    const key = import.meta.env[`VITE_GEMINI_API_KEY_${i}`];
    if (key && !key.startsWith("在这里填入")) {
      console.log(`找到密钥 VITE_GEMINI_API_KEY_${i}`);
      keys.push(key);
    }
  }
  // 兼容旧的单个密钥格式
  const singleKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (singleKey && !keys.includes(singleKey) && !singleKey.startsWith("AIzaSy")) {
      console.log("找到旧格式的密钥 VITE_GEMINI_API_KEY");
      keys.push(singleKey);
  }
  console.log(`总共找到 ${keys.length} 个可用密钥。`);
  return keys;
}

/**
 * 根据用户偏好生成一个包含练习内容和配套问题的完整练习包
 * @param {string} topic - 练习主题
 * @param {string} lexileLevel - 蓝思难度等级
 * @param {string} contentType - 内容类型 ('text' 或 'audio')
 * @returns {Promise<object>} - 返回一个包含练习内容的JSON对象
 */
export async function generatePractice(topic, lexileLevel, contentType) {
  const apiKeys = getAvailableApiKeys();

  if (apiKeys.length === 0) {
    console.error("Gemini API 密钥未配置。");
    // 返回模拟数据作为备用方案
    return {
      type: "text_with_questions",
      content: `This is a mock paragraph because no API key is configured. The topic was ${topic}.`,
      questions: [{ question_text: "What is the main point?", options: ["A", "B", "C", "D"], correct_answer: "A" }]
    };
  }

  const model = "gemini-1.5-pro-latest";

  // 根据 contentType 动态生成不同的 prompt
  const prompt = `
    You are an English learning assistant. Your task is to create a single, short English exercise package for a user.
    The user's desired topic is: "${topic}".
    The user's desired Lexile level is: "${lexileLevel}".
    The user's desired content type is: "${contentType}".

    Please provide the output ONLY in the following JSON format, with no extra text or explanations.

    ${contentType === 'text' ?
    `
    The package MUST contain:
    1. A short text "content" (about 50-80 words).
    2. An array of 1-2 multiple-choice "questions" to test comprehension.

    JSON structure for "text":
    {
      "type": "text_with_questions",
      "content": "A short paragraph (50-80 words) about the topic and Lexile level.",
      "questions": [ { "question_text": "...", "options": ["...", "...", "...", "..."], "correct_answer": "..." } ]
    }
    ` :
    `
    The package MUST contain:
    1. A short "script" for Text-to-Speech (TTS), about 25-30 seconds of speaking time.
    2. An array of 1-2 multiple-choice "questions" to test listening comprehension.

    JSON structure for "audio":
    {
      "type": "audio_with_questions",
      "script": "A script for TTS (25-30 seconds long) about the topic and Lexile level.",
      "questions": [ { "question_text": "...", "options": ["...", "...", "...", "..."], "correct_answer": "..." } ]
    }
    `
    }

    Now, generate the exercise package based on the user's request.
  `;

  // --- 新增：使用密钥池进行循环重试 ---
  for (const apiKey of apiKeys) {
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    };

    try {
      console.log(`%c[密钥轮换] 正在尝试使用密钥 ...${apiKey.slice(-4)}`, 'color: blue; font-weight: bold;');
      const apiResponse = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (apiResponse.status === 429) {
        console.warn(`%c[密钥轮换] 密钥 ...${apiKey.slice(-4)} 遭遇速率限制 (429)。正在切换到下一个密钥...`, 'color: orange;');
        continue; // 跳过当前循环，尝试下一个密钥
      }

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error(`%c[密钥轮换] 密钥 ...${apiKey.slice(-4)} 返回了一个API错误 (状态码: ${apiResponse.status})。正在切换到下一个密钥...`, 'color: red;', errorData);
        continue;
      }

      const responseData = await apiResponse.json();
      const text = responseData.candidates[0].content.parts[0].text;
      console.log(`%c[密钥轮换] 密钥 ...${apiKey.slice(-4)} 请求成功！`, 'color: green; font-weight: bold;');
      return JSON.parse(text); // 成功获取数据，立即返回

    } catch (networkError) {
      console.error(`%c[密钥轮换] 使用密钥 ...${apiKey.slice(-4)} 时发生网络错误。正在切换到下一个密钥...`, 'color: red;', networkError);
      continue;
    }
  }

  // 如果所有密钥都尝试失败，最终抛出速率限制错误
  console.error("所有可用的 Gemini API 密钥都已达到速率限制。");
  throw new Error("RATE_LIMIT_EXCEEDED");
}
