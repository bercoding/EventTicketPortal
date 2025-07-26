const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

router.post('/openai-chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: 'cognitivecomputations/dolphin3.0-mistral-24b:free',
        messages: [
          { role: 'system', content: 'Bạn là một trợ lý AI thân thiện.' },
          { role: 'user', content: message }
        ],
        max_tokens: 200
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('OpenRouter API response error:', data);
    }
    const reply = data.choices?.[0]?.message?.content?.trim() || 'Xin lỗi, tôi không thể trả lời lúc này.';
    res.json({ reply });
  } catch (err) {
    console.error('OpenRouter API error:', err);
    res.status(500).json({ error: 'OpenRouter API error' });
  }
});

module.exports = router;