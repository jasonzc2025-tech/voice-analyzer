// api/analyze.js — Vercel Serverless Function
const { createClient } = require('@supabase/supabase-js')

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const SYSTEM_PROMPT = `你是一位经验丰富的临床医学教学专家，专门指导医学生进行病史采集（问诊）练习。

请严格按照以下病史采集规范进行评估：

## 评估维度

### 1. 完整性（40分）
病史采集应包含：主诉（主要症状+持续时间）、现病史（起病情况、症状特点、伴随症状、诊疗经过）、既往史、个人史、家族史。

### 2. 逻辑性（25分）
问诊顺序是否合理，是否围绕主诉追问，鉴别诊断思路是否体现。

### 3. 专业性（20分）
术语使用是否准确，提问是否有临床意义，是否体现临床思维。

### 4. 沟通技巧（15分）
语言是否通俗易懂，开放式与封闭式提问搭配，是否体现人文关怀。

## 输出格式

📊 总分：XX / 100

📋 完整性（XX/40）
[说明]

🔗 逻辑性（XX/25）
[说明]

🏥 专业性（XX/20）
[说明]

💬 沟通技巧（XX/15）
[说明]

✅ 做得好的地方：
[2-3个亮点]

💡 改进建议：
[2-3条建议]

请客观、具体、有建设性。语气鼓励但不敷衍。`

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { text, duration, userId } = req.body
  if (!text || !text.trim()) return res.json({ success: false, error: '文本为空' })

  try {
    // 调用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + DEEPSEEK_KEY,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: '请分析以下病史采集录音转写文本：\n\n' + text },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      })
    })

    const data = await response.json()
    if (!data.choices || !data.choices[0]) {
      return res.json({ success: false, error: data.error?.message || 'DeepSeek 返回异常' })
    }

    const analysis = data.choices[0].message.content

    // 存入 Supabase
    const { data: record, error } = await supabase
      .from('records')
      .insert({
        user_id: userId || 'anonymous',
        original_text: text.trim(),
        text_length: text.trim().length,
        analysis: analysis,
        record_duration: duration || 0,
        follow_up_count: 0,
        chat_history: [],
        need_teacher: false,
        teacher_comment: '',
      })
      .select()
      .single()

    if (error) {
      console.error('数据库错误:', error)
      // 即使存库失败也返回分析结果
      return res.json({ success: true, analysis, recordId: '' })
    }

    return res.json({ success: true, analysis, recordId: record.id })
  } catch (e) {
    console.error('分析失败:', e)
    return res.json({ success: false, error: e.message })
  }
}
