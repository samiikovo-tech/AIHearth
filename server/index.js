const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json({limit:'2mb'}));
app.use(express.static('.'));

const limiter = rateLimit({windowMs:60*1000,max:50});
app.use(limiter);

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if(!OPENAI_KEY){
  console.warn('Warning: OPENAI_API_KEY not set. /api/chat, /api/moderation and /api/image will return simulated responses until configured.');
}

// Helper: call OpenAI Chat Completion via server key
async function callOpenAIChat(messages, model='gpt-4'){
  if(!OPENAI_KEY) return { simulated: true, reply: `Simulated (server): ${messages[messages.length-1].content.split(' ').slice(0,10).join(' ')}...` };
  const resp = await fetch('https://api.openai.com/v1/chat/completions',{
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ model, messages, max_tokens: 400, temperature: 0.9 })
  });
  const data = await resp.json();
  return { simulated: false, data };
}

// Helper: moderation
async function moderateText(text){
  if(!OPENAI_KEY){
    // simple heuristic fallback
    const blocked = /\b(?:shit|fuck|smrad|prdel|prd)\b/i.test(text);
    return { blocked, categories: null };
  }
  const resp = await fetch('https://api.openai.com/v1/moderations',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${OPENAI_KEY}`},body:JSON.stringify({input:text})});
  const data = await resp.json();
  const results = data?.results?.[0];
  const blocked = !!results?.flagged;
  return { blocked, categories: results };
}

// Chat endpoint (used by client when using server proxy)
app.post('/api/chat', async (req, res) => {
  try{
    const { character, message, convo, model } = req.body;
    if(!message) return res.status(400).json({error:'message required'});

    // moderation (server-side) before sending to model
    const mod = await moderateText(message);
    if(mod.blocked){
      return res.status(400).json({error:'Message blocked by moderation'});
    }

    let system = 'You are a friendly conversational AI.';
    if(character){
      const p = character.personality || '';
      const s = character.scenario || '';
      system = `You are roleplaying as ${character.name}. Personality: ${p}. Scenario: ${s}. Keep replies short and in Slovak when possible.`;
    }

    const messages = [
      {role:'system',content:system},
      ...(Array.isArray(convo)?convo.slice(-8).map(m=>({role:m.sender==='user'?'user':'assistant',content:m.text})):[]),
      {role:'user',content:message}
    ];

    const chosenModel = model || process.env.OPENAI_MODEL || 'gpt-4';
    const result = await callOpenAIChat(messages, chosenModel);
    if(result.simulated){
      return res.json({reply: result.reply});
    }
    const text = result.data?.choices?.[0]?.message?.content || result.data?.error?.message || '';
    res.json({reply:text});
  }catch(err){
    console.error(err);
    res.status(500).json({error:'server error'});
  }
});

// Moderation endpoint: allows client to ask server to moderate text
app.post('/api/moderation', async (req, res) => {
  try{
    const { text } = req.body;
    if(!text) return res.status(400).json({error:'text required'});
    const result = await moderateText(text);
    res.json(result);
  }catch(err){console.error(err);res.status(500).json({error:'server error'})}
});

// Image generation endpoint: uses server key to call OpenAI Images (DALL·E) or returns simulated URL
app.post('/api/image', async (req, res) => {
  try{
    const { prompt, size } = req.body;
    if(!prompt) return res.status(400).json({error:'prompt required'});

    // moderation on prompt
    const mod = await moderateText(prompt);
    if(mod.blocked) return res.status(400).json({error:'Prompt blocked by moderation'});

    if(!OPENAI_KEY){
      // simulated image URL
      return res.json({url: `https://via.placeholder.com/512x512.png?text=${encodeURIComponent(prompt.slice(0,20))}`});
    }

    // call OpenAI Images endpoint (DALL·E)
    const resp = await fetch('https://api.openai.com/v1/images/generations',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${OPENAI_KEY}`},
      body: JSON.stringify({prompt, n:1, size: size||'512x512'})
    });
    const data = await resp.json();
    const url = data?.data?.[0]?.url || data?.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : null;
    res.json({url});
  }catch(err){console.error(err);res.status(500).json({error:'server error'})}
});

const PORT = process.env.PORT||3000;
app.listen(PORT,()=>console.log('Server running on',PORT));
