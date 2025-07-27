// 从环境变量中获取 API 密钥
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * 根据用户偏好生成一个包含练习内容和配套问题的完整练习包
 * @param {string} topic - 练习主题
 * @param {string} lexileLevel - 蓝思难度等级
 * @param {string} contentType - 内容类型 ('text' 或 'audio')
 * @returns {Promise<object>} - 返回一个包含练习内容的JSON对象
 */
export async function generatePractice(topic, lexileLevel, contentType) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
    console.error("Gemini API key is not configured.");
    // 根据内容类型返回不同的模拟数据
    if (contentType === 'audio') {
        return {
            type: "audio_with_questions",
            script: `This is a mock audio script about ${topic}. It's designed to be about 25 seconds long when read aloud.`,
            questions: [{ question_text: "What is the main idea of the audio?", options: ["Idea A", "Idea B", "The correct idea", "Idea D"], correct_answer: "The correct idea" }]
        };
    }
    return {
      type: "text_with_questions",
      content: `This is a mock paragraph about ${topic}. The main point is that AI is transforming the tech industry.`,
      questions: [{ question_text: "What is the main point?", options: ["AI is not important", "AI is transforming the tech industry", "Tech is not changing", "AI is simple"], correct_answer: "AI is transforming the tech industry" }]
    };
  }

  const model = "gemini-1.5-flash-latest";
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

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

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" }
  };

  try {
    const apiResponse = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error("Google API Error Response:", errorData);
        throw new Error(`Google API responded with status: ${apiResponse.status}`);
    }

    const responseData = await apiResponse.json();
    const text = responseData.candidates[0].content.parts[0].text;
    return JSON.parse(text);

  } catch (error) {
    console.error("Error generating practice content:", error);
    throw new Error("Failed to generate practice content from Gemini API.");
  }
}