const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json({limit:'1mb'}));
app.use(express.static('.'));

const limiter = rateLimit({windowMs:60*1000,max:20});
app.use(limiter);

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if(!OPENAI_KEY){
  console.warn('Warning: OPENAI_API_KEY not set. /api/chat will fail until configured.');
}

app.post('/api/chat', async (req, res) => {
  try{
    const { character, message, convo } = req.body;
    if(!message) return res.status(400).json({error:'message required'});
    // build system prompt from character
    let system = 'You are a friendly conversational AI.';
    if(character){
      const p = character.personality || '';
      const s = character.scenario || '';
      system = `You are roleplaying as ${character.name}. Personality: ${p}. Scenario: ${s}. Keep replies short and in Slovak when possible.`;
    }

    const messages = [
      {role:'system',content:system},
      // include last few messages
      ...(Array.isArray(convo)?convo.slice(-8).map(m=>({role:m.sender==='user'?'user':'assistant',content:m.text})):[]),
      {role:'user',content:message}
    ];

    if(!OPENAI_KEY){
      // simulated reply
      const reply = `Simulated reply as ${character?character.name:'AI'}: ${message.split(' ').slice(0,8).join(' ')}...`;
      return res.json({reply});
    }

    // Prefer OPENAI_MODEL env or default to gpt-4 as requested
    const MODEL = process.env.OPENAI_MODEL || 'gpt-4';

    const resp = await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':`Bearer ${OPENAI_KEY}`
      },
      body:JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: 300,
        temperature: 0.9
      })
    });

    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content || data?.error?.message || '';
    res.json({reply:text});
  }catch(err){
    console.error(err);
    res.status(500).json({error:'server error'});
  }
});

const PORT = process.env.PORT||3000;
app.listen(PORT,()=>console.log('Server running on',PORT));
