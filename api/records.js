// api/records.js
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const TEACHER_PWD = process.env.TEACHER_PASSWORD || 'teacher123'

module.exports = async (req, res) => {
  // POST: 保存老师点评
  if (req.method === 'POST') {
    const { action, recordId, comment, pwd } = req.body
    if (pwd !== TEACHER_PWD) return res.json({ success: false, error: 'unauthorized' })

    if (action === 'comment') {
      const { error } = await supabase.from('records').update({
        teacher_comment: comment || '',
        need_teacher: false,
      }).eq('id', recordId)

      return res.json({ success: !error, error: error?.message })
    }
    return res.json({ success: false, error: 'unknown action' })
  }

  // GET: 查询记录
  const { page = 0, pageSize = 20, filter = 'all', pwd } = req.query
  if (pwd !== TEACHER_PWD) return res.json({ success: false, error: 'unauthorized' })

  try {
    let query = supabase.from('records').select('*', { count: 'exact' })

    if (filter === 'needTeacher') {
      query = query.eq('need_teacher', true)
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) return res.json({ success: false, error: error.message })

    return res.json({ success: true, records: data, total: count })
  } catch (e) {
    return res.json({ success: false, error: e.message })
  }
}
