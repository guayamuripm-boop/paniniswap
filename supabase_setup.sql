-- =============================================
-- MetaXport - Setup de Grupos y Chat
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =============================================

-- 1. GRUPOS DE INTERCAMBIO
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  code TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- 2. CHAT INTERNO
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  receiver_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  read BOOLEAN DEFAULT false
);

-- 3. RLS (Row Level Security)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Groups policies
DROP POLICY IF EXISTS "view_groups" ON groups;
CREATE POLICY "view_groups" ON groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "create_groups" ON groups;
CREATE POLICY "create_groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "update_groups" ON groups;
CREATE POLICY "update_groups" ON groups
  FOR UPDATE USING (auth.uid() = created_by);

-- Group members policies
DROP POLICY IF EXISTS "view_members" ON group_members;
CREATE POLICY "view_members" ON group_members
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "join_groups" ON group_members;
CREATE POLICY "join_groups" ON group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "leave_groups" ON group_members;
CREATE POLICY "leave_groups" ON group_members
  FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
DROP POLICY IF EXISTS "view_messages" ON messages;
CREATE POLICY "view_messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "send_messages" ON messages;
CREATE POLICY "send_messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "update_messages" ON messages;
CREATE POLICY "update_messages" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- 4. Habilitar Realtime para mensajes (chat en vivo)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
