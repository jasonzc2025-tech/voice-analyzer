# 🩺 病史采集练习 - 网页版

无需审核，学生打开链接即可使用。免费部署在 Vercel + Supabase 上。

## 部署步骤（约 20 分钟）

### 第一步：创建 Supabase 数据库（免费）

1. 打开 https://supabase.com → 用 GitHub 账号注册登录
2. 点「New Project」创建项目（Region 选 Singapore 或 Northeast Asia）
3. 设置数据库密码（记住它）
4. 等创建完成后，进入项目 → 左侧点「SQL Editor」
5. 粘贴以下 SQL 并点「Run」:

```sql
CREATE TABLE records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  original_text TEXT NOT NULL,
  text_length INTEGER DEFAULT 0,
  analysis TEXT,
  record_duration INTEGER DEFAULT 0,
  follow_up_count INTEGER DEFAULT 0,
  chat_history JSONB DEFAULT '[]',
  need_teacher BOOLEAN DEFAULT false,
  teacher_comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 允许匿名读写（通过 service key 访问，安全由后端控制）
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all via service key" ON records FOR ALL USING (true);
```

6. 获取连接信息：
   - 左侧点「Settings」→「API」
   - 复制 **Project URL**（类似 `https://xxxxx.supabase.co`）
   - 复制 **service_role key**（注意是 service_role，不是 anon）

### 第二步：部署到 Vercel（免费）

1. 打开 https://github.com → 注册/登录
2. 创建一个新仓库（Repository），名字随意如 `voice-analyzer`
3. 把本项目所有文件上传到这个仓库
4. 打开 https://vercel.com → 用 GitHub 账号登录
5. 点「Import Project」→ 选择刚才的仓库 → 点「Import」
6. 在部署设置页面，找到「Environment Variables」，添加以下 4 个：

| Key | Value |
|-----|-------|
| `DEEPSEEK_API_KEY` | 你的 DeepSeek API Key |
| `SUPABASE_URL` | Supabase 的 Project URL |
| `SUPABASE_KEY` | Supabase 的 service_role key |
| `TEACHER_PASSWORD` | 教师后台密码（你自己定，如 `mypassword123`） |

7. 点「Deploy」→ 等 1 分钟部署完成
8. Vercel 会给你一个网址如 `https://voice-analyzer-xxx.vercel.app`

### 第三步：分享给学生

- 直接把网址发到微信群/钉钉群
- 学生在手机上用**微信**或**Chrome浏览器**打开
- 推荐用微信直接打开（语音识别兼容性好）

## 使用说明

### 学生端（首页）
1. 点「点击开始录音」→ 浏览器会请求麦克风权限
2. 开始模拟问诊（边说文字边出来）
3. 说完点「停止录音」
4. 点「开始 AI 分析」→ 等待 AI 评分
5. 可就反馈追问最多 5 次

### 教师端（/teacher.html）
1. 输入你设置的教师密码进入
2. 查看所有学生的练习记录
3. 筛选「待介入」记录
4. 可为每条记录添加人工点评
5. 可导出 CSV 用于研究

## 费用

全部免费：
- Vercel 免费套餐：每月 100GB 流量
- Supabase 免费套餐：500MB 数据库
- DeepSeek API：每次分析约 ¥0.01
