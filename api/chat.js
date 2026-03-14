// api/chat.js
const { createClient } = require('@supabase/supabase-js')

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const MAX_FOLLOWUPS = 5

const SYSTEM_PROMPT = `你是一位临床医学教学专家，正在和医学生讨论病史采集练习的表现。
回答要具体、有教学意义，可以举例说明更好的问诊方式。
语气友善耐心，回答控制在200字以内。`

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { recordId, question, followUpCount, userId } = req.body
  if (!recordId || !question) return res.json({ success: false, error: '参数缺失' })
  if (followUpCount > MAX_FOLLOWUPS) return res.json({ success: false, error: '追问次数已用完' })

  try {
    // 获取原始记录
    const { data: record } = await supabase.from('records').select().eq('id', recordId).single()
    if (!record) return res.json({ success: false, error: '记录不存在' })

    // 构建对话
    let messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: '我的病史采集原文：\n' + record.original_text },
      { role: 'assistant', content: '我的评价：\n' + record.analysis },
    ]

    if (record.chat_history) {
      record.chat_history.forEach(c => {
        messages.push({ role: 'user', content: c.question })
        messages.push({ role: 'assistant', content: c.reply })
      })
    }
    messages.push({ role: 'user', content: question })

    // 调用 DeepSeek
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + DEEPSEEK_KEY },
      body: JSON.stringify({ model: 'deepseek-chat', messages, max_tokens: 800, temperature: 0.7 })
    })
    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || '回复失败'

    // 更新数据库
    const newHistory = [...(record.chat_history || []), { question, reply, time: new Date().toISOString() }]
    await supabase.from('records').update({
      chat_history: newHistory,
      follow_up_count: followUpCount,
      need_teacher: followUpCount >= MAX_FOLLOWUPS,
    }).eq('id', recordId)

    return res.json({ success: true, reply })
  } catch (e) {
    console.error('追问失败:', e)
    return res.json({ success: false, error: e.message })
  }
}
