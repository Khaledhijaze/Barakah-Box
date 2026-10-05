-- FINANCIAL FIREWALL & STRICT ANTI-HACKING SECURITY (RLS)
-- Platform: Supabase (PostgreSQL)
-- App: Barakah Box (صندوق بركة) - Syria

-- 1. EXTEND AUDIT LOGS FOR WITHDRAWALS
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS security_stamp JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address INET;

-- 2. ENABLE ROW LEVEL SECURITY (RLS) ON ALL CRITICAL TABLES
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_rules ENABLE ROW LEVEL SECURITY;

-- 3. DEFINE RLS POLICIES (STRICT ACCESS)

-- Users can only view and manage their own wallet
CREATE POLICY "Users can only access their own wallet"
ON wallets
FOR ALL
USING (auth.uid() = user_id);

-- Partners can only view their own store data
CREATE POLICY "Partners view own branch data"
ON stores
FOR ALL
USING (auth.uid() = owner_id);

-- Captains view only assigned delivery tasks
CREATE POLICY "Captains view assigned tasks"
ON orders
FOR ALL
USING (auth.uid() = driver_id);

-- Admin-only write access for reward_rules
CREATE POLICY "Admins manage reward rules"
ON reward_rules
FOR ALL
USING (auth.jwt()->>'role' = 'admin');

-- Public read access for active reward rules
CREATE POLICY "Public view active rewards"
ON reward_rules
FOR SELECT
USING (is_active = true);

-- 4. ATOMIC SERVER-SIDE WALLET OPERATIONS (RPC)
-- Prevents client-side balance mutations and ensuring row locks
CREATE OR REPLACE FUNCTION process_secure_withdrawal(
  p_user_id UUID,
  p_amount NUMERIC,
  p_method TEXT,
  p_account_info TEXT,
  p_security_code TEXT
) RETURNS JSONB AS $$
DECLARE
  v_current_balance NUMERIC;
  v_daily_total NUMERIC;
  v_limit NUMERIC;
  v_ref_code TEXT;
BEGIN
  -- 1. Check Daily Limits (Fraud Prevention)
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM audit_logs
  WHERE user_id = p_user_id
    AND action_type = 'WALLET_WITHDRAWAL'
    AND created_at > NOW() - INTERVAL '1 day';

  -- Set limit based on role (simplified)
  v_limit := 500000; -- Example for Partners

  IF (v_daily_total + p_amount) > v_limit THEN
    RETURN jsonb_build_object('success', false, 'message', 'Daily withdrawal limit exceeded');
  END IF;

  -- 2. Row Lock & Balance Verification
  SELECT balance_syp INTO v_current_balance FROM wallets WHERE user_id = p_user_id FOR UPDATE;

  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient balance');
  END IF;

  -- 3. Atomic Transaction
  UPDATE wallets SET balance_syp = balance_syp - p_amount WHERE user_id = p_user_id;

  v_ref_code := 'PAY-' || floor(random() * 899999 + 100000)::text;

  INSERT INTO audit_logs (uuid, user_id, action_type, amount, details, security_stamp)
  VALUES (v_ref_code, p_user_id, 'WALLET_WITHDRAWAL', p_amount, 'Atomic withdrawal to ' || p_method, 
    jsonb_build_object('ip', inet_client_addr(), 'method', p_method, 'account', p_account_info));

  RETURN jsonb_build_object('success', true, 'ref_code', v_ref_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
