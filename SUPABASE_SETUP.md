# Supabase Setup Guide for Noor Family App

This guide will help you set up Supabase authentication and database for the Noor Family application.

## Prerequisites

✅ Supabase JavaScript client installed (`@supabase/supabase-js`)
✅ Supabase project created at https://supabase.com

## Step 1: Get Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Settings > API**
4. Copy the following:
   - **Project URL** (e.g., `https://xxxxxxxxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 2: Configure Environment Variables

Update your `.env.local` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **Important**: Never commit `.env.local` to version control!

## Step 3: Create Database Schema

Go to your Supabase dashboard, navigate to **SQL Editor**, and run the following SQL commands:

### 3.1 Create Users Table

```sql
-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT '👤',
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_users_family_id ON public.users(family_id);
CREATE INDEX idx_users_email ON public.users(email);
```

### 3.2 Create Families Table

```sql
-- Create families table
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE,
  shared_khatma_target INTEGER DEFAULT 0,
  shared_khatma_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_families_invite_code ON public.families(invite_code);
```

### 3.3 Create Worship Logs Table

```sql
-- Create worship_logs table
CREATE TABLE public.worship_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  prayers JSONB NOT NULL DEFAULT '[]',
  azpi_morning BOOLEAN DEFAULT FALSE,
  azpi_evening BOOLEAN DEFAULT FALSE,
  quran_pages INTEGER DEFAULT 0,
  fasting BOOLEAN DEFAULT FALSE,
  duha BOOLEAN DEFAULT FALSE,
  witr BOOLEAN DEFAULT FALSE,
  qiyam BOOLEAN DEFAULT FALSE,
  qiyam_private BOOLEAN DEFAULT TRUE,
  sadaqa_private BOOLEAN DEFAULT FALSE,
  dua_private BOOLEAN DEFAULT FALSE,
  iftar BOOLEAN DEFAULT FALSE,
  tarawih BOOLEAN DEFAULT FALSE,
  tarawih_rakaat INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create indexes for faster queries
CREATE INDEX idx_worship_logs_user_id ON public.worship_logs(user_id);
CREATE INDEX idx_worship_logs_date ON public.worship_logs(date);
CREATE INDEX idx_worship_logs_user_date ON public.worship_logs(user_id, date);
```

### 3.4 Create Rewards Table (Optional)

```sql
-- Create rewards table
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rewards_family_id ON public.rewards(family_id);
```

### 3.5 Create Challenges Table (Optional)

```sql
-- Create challenges table
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  target_days INTEGER NOT NULL,
  current_days INTEGER DEFAULT 0,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_challenges_family_id ON public.challenges(family_id);
CREATE INDEX idx_challenges_active ON public.challenges(active);
```

### 3.6 Create Nudges Table (Optional)

```sql
-- Create nudges table
CREATE TABLE public.nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nudges_to_user ON public.nudges(to_user_id);
CREATE INDEX idx_nudges_from_user ON public.nudges(from_user_id);
```

## Step 4: Set Up Row Level Security (RLS)

### 4.1 Enable RLS on All Tables

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worship_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;
```

### 4.2 Create RLS Policies for Users

```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Users can view family members
CREATE POLICY "Users can view family members"
  ON public.users FOR SELECT
  USING (
    family_id IS NOT NULL AND
    family_id IN (SELECT family_id FROM public.users WHERE id = auth.uid())
  );

-- Service role can insert users (for signup)
CREATE POLICY "Service can insert users"
  ON public.users FOR INSERT
  WITH CHECK (true);
```

### 4.3 Create RLS Policies for Families

```sql
-- Users can view their own family
CREATE POLICY "Users can view own family"
  ON public.families FOR SELECT
  USING (
    id IN (SELECT family_id FROM public.users WHERE id = auth.uid())
  );

-- Admins can update their family
CREATE POLICY "Admins can update family"
  ON public.families FOR UPDATE
  USING (
    id IN (
      SELECT family_id FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow family creation
CREATE POLICY "Users can create families"
  ON public.families FOR INSERT
  WITH CHECK (true);
```

### 4.4 Create RLS Policies for Worship Logs

```sql
-- Users can view their own logs
CREATE POLICY "Users can view own logs"
  ON public.worship_logs FOR SELECT
  USING (user_id = auth.uid());

-- Users can view family members' logs
CREATE POLICY "Users can view family logs"
  ON public.worship_logs FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.users
      WHERE family_id = (
        SELECT family_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- Users can insert/update their own logs
CREATE POLICY "Users can manage own logs"
  ON public.worship_logs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### 4.5 Create RLS Policies for Rewards

```sql
-- Users can view family rewards
CREATE POLICY "Users can view family rewards"
  ON public.rewards FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Admins can manage rewards
CREATE POLICY "Admins can manage rewards"
  ON public.rewards FOR ALL
  USING (
    family_id IN (
      SELECT family_id FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 4.6 Create RLS Policies for Challenges

```sql
-- Users can view family challenges
CREATE POLICY "Users can view family challenges"
  ON public.challenges FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Admins can manage challenges
CREATE POLICY "Admins can manage challenges"
  ON public.challenges FOR ALL
  USING (
    family_id IN (
      SELECT family_id FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 4.7 Create RLS Policies for Nudges

```sql
-- Users can view nudges sent to them
CREATE POLICY "Users can view received nudges"
  ON public.nudges FOR SELECT
  USING (to_user_id = auth.uid());

-- Users can view nudges they sent
CREATE POLICY "Users can view sent nudges"
  ON public.nudges FOR SELECT
  USING (from_user_id = auth.uid());

-- Users can send nudges to family members
CREATE POLICY "Users can send nudges to family"
  ON public.nudges FOR INSERT
  WITH CHECK (
    from_user_id = auth.uid() AND
    to_user_id IN (
      SELECT id FROM public.users
      WHERE family_id = (
        SELECT family_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- Users can update nudges sent to them
CREATE POLICY "Users can update received nudges"
  ON public.nudges FOR UPDATE
  USING (to_user_id = auth.uid());
```

## Step 5: Configure Authentication

### 5.1 Email Authentication Settings

1. Go to **Authentication > Providers** in Supabase dashboard
2. Enable **Email** provider
3. Configure email templates (optional)
4. Set up SMTP settings for production (optional)

### 5.2 Configure Site URL

1. Go to **Authentication > URL Configuration**
2. Set **Site URL** to your app's URL:
   - Development: `http://localhost:5173`
   - Production: `https://your-domain.com`

## Step 6: Test the Setup

### 6.1 Test Authentication

1. Start your development server: `npm run dev`
2. Navigate to `/auth`
3. Try creating a new account
4. Check Supabase dashboard under **Authentication > Users** to verify user creation
5. Check **Table Editor > users** to verify profile creation
6. Try logging out and logging back in

### 6.2 Test Database Operations

You can test database operations using the Supabase SQL Editor:

```sql
-- Check if users are created
SELECT * FROM public.users;

-- Check if worship logs are saved
SELECT * FROM public.worship_logs;

-- Check families
SELECT * FROM public.families;
```

## Step 7: Switch to Supabase Service

Once the database is set up and tested, you can switch your app to use Supabase:

1. Import Supabase functions instead of localStorage functions:

```typescript
// Instead of:
import * as ws from "@/services/worshipService";

// Use:
import * as ws from "@/services/worshipServiceSupabase";
```

2. Update function calls to handle async operations:

```typescript
// Before (localStorage):
const logs = ws.getWorshipLogs();

// After (Supabase):
const logs = await ws.getWorshipLogs();
```

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution**: Make sure `.env.local` exists and contains valid credentials. Restart your dev server after creating/updating `.env.local`.

### Issue: "Row Level Security policy violation"

**Solution**: Check that RLS policies are properly configured. Use the SQL Editor to verify policies:

```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
```

### Issue: Users can't see family members

**Solution**: Ensure users have the same `family_id`. Create a family first, then assign users to it:

```sql
-- Create a family
INSERT INTO public.families (name) VALUES ('My Family') RETURNING id;

-- Assign users to family (replace UUIDs with actual IDs)
UPDATE public.users SET family_id = 'family-uuid-here' WHERE id = 'user-uuid-here';
```

### Issue: Can't create worship logs

**Solution**: Check that the user_id exists in the users table and matches the authenticated user's ID.

## Real-time Updates (Optional)

To enable real-time updates for worship logs:

```typescript
import { supabase } from "@/lib/supabase";

// Subscribe to changes
const subscription = supabase
  .channel("worship_logs_changes")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "worship_logs",
    },
    (payload) => {
      console.log("Change received!", payload);
      // Update your UI here
    },
  )
  .subscribe();

// Cleanup when component unmounts
return () => {
  subscription.unsubscribe();
};
```

## Security Best Practices

1. **Never expose your service_role key** - Only use it in backend/server code
2. **Use the anon key in frontend** - It respects RLS policies
3. **Always use RLS policies** - Never rely on client-side security alone
4. **Validate user input** - Use database constraints and validation
5. **Use HTTPS in production** - Configure SSL/TLS properly
6. **Regular backups** - Enable automatic backups in Supabase settings

## Next Steps

- [ ] Set up email templates for password reset
- [ ] Configure OAuth providers (Google, GitHub, etc.)
- [ ] Set up database backups
- [ ] Add database triggers for automatic timestamps
- [ ] Implement real-time subscriptions
- [ ] Set up monitoring and alerts
- [ ] Configure rate limiting

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

---

**Need Help?** Check the [Supabase Discord](https://discord.supabase.com/) or [GitHub Discussions](https://github.com/supabase/supabase/discussions)
