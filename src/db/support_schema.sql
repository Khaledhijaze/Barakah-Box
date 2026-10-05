-- ==============================================================================
-- BARAKAH BOX PLATFORM (صندوق بركة) - SUPABASE POSTGRESQL SCHEMA
-- CUSTOMER SUPPORT, DISPUTE RESOLUTION & INSTANT WALLET REFUND SUBSYSTEM
-- Benchmark: Saudi Barakah Food-Rescue Standards
-- ==============================================================================

-- 1. Enable Required UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles and Wallets Reference Table
CREATE TABLE IF NOT EXISTS public.user_wallets (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30) NOT NULL UNIQUE,
    governorate VARCHAR(50) NOT NULL,
    balance_syp NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance_syp >= 0.00),
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Support Tickets Table (Order-Linked & SLA-Governed)
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(30) UNIQUE NOT NULL, -- e.g. TKT-2026-9048
    user_id UUID REFERENCES public.user_wallets(user_id) ON DELETE CASCADE,
    order_id VARCHAR(50) NOT NULL,
    merchant_id UUID,
    governorate VARCHAR(50) NOT NULL,
    issue_type VARCHAR(50) NOT NULL CHECK (
        issue_type IN (
            'store_closed',           -- المتجر كان مغلقاً عند الوصول (Instant Auto-Refund)
            'item_damaged',           -- محتويات السلة ناقصة أو تالفة (Photo Proof Required)
            'payment_unconfirmed',    -- تم الدفع ولم يتم تأكيد الطلب
            'driver_issue',           -- مشكلة في التوصيل أو الكابتن
            'customer_no_show',       -- مطالبة تخلف الزبون من التاجر
            'general'                 -- استفسارات عامة
        )
    ),
    category_label VARCHAR(100) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    proof_photo_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'open' CHECK (
        status IN ('open', 'in_progress', 'auto_refunded', 'resolved', 'rejected')
    ),
    priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (
        priority IN ('low', 'normal', 'high', 'urgent')
    ),
    auto_refund_eligible BOOLEAN DEFAULT FALSE,
    refund_amount_syp NUMERIC(12, 2) DEFAULT 0.00,
    admin_decision VARCHAR(50) CHECK (
        admin_decision IN ('approved_refund', 'rejected', 'penalized_merchant', 'pending')
    ),
    assigned_agent_id UUID,
    resolution_speed_seconds INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indexing for Rapid Dashboard Queue Lookups
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_order_id ON public.support_tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_issue_type ON public.support_tickets(issue_type);

-- 4. Ticket Messages Table (Conversation Thread between Consumer, Agent & AI)
CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'merchant', 'agent', 'system', 'ai_assistant')),
    sender_name VARCHAR(100) NOT NULL,
    message_text TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);

-- 5. Wallet Refund & Payout Audit Logs Table
CREATE TABLE IF NOT EXISTS public.wallet_refund_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    refund_reference VARCHAR(50) UNIQUE NOT NULL, -- e.g. REF-AUTO-9048
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.user_wallets(user_id) ON DELETE RESTRICT,
    order_id VARCHAR(50) NOT NULL,
    amount_syp NUMERIC(12, 2) NOT NULL CHECK (amount_syp > 0),
    refund_type VARCHAR(30) NOT NULL CHECK (
        refund_type IN ('instant_auto_refund', 'admin_approved_refund', 'merchant_no_show_payout', 'goodwill_credit')
    ),
    trigger_source VARCHAR(50) NOT NULL, -- e.g. 'store_closed_policy', 'admin_panel', 'merchant_portal'
    previous_balance_syp NUMERIC(15, 2) NOT NULL,
    new_balance_syp NUMERIC(15, 2) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 6. AUTOMATED POSTGRES TRIGGER: INSTANT WALLET REFUND & AUDIT
-- Automatically increments consumer wallet balance and logs financial movement
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fn_process_instant_wallet_refund()
RETURNS TRIGGER AS $$
DECLARE
    v_current_balance NUMERIC(15, 2);
    v_new_balance NUMERIC(15, 2);
    v_ref_code VARCHAR(50);
BEGIN
    -- Only execute when status moves to 'auto_refunded' or 'resolved' with 'approved_refund'
    IF (NEW.status = 'auto_refunded' OR (NEW.status = 'resolved' AND NEW.admin_decision = 'approved_refund')) 
       AND (OLD.status IS DISTINCT FROM NEW.status)
       AND (NEW.refund_amount_syp > 0) THEN

        -- Lock the target wallet row for update
        SELECT balance_syp INTO v_current_balance
        FROM public.user_wallets
        WHERE user_id = NEW.user_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Target user wallet not found for refund processing: %', NEW.user_id;
        END IF;

        v_new_balance := v_current_balance + NEW.refund_amount_syp;
        v_ref_code := 'REF-' || to_char(now(), 'YYYYMMDD') || '-' || substring(NEW.id::text, 1, 8);

        -- Update the user's wallet balance
        UPDATE public.user_wallets
        SET balance_syp = v_new_balance,
            updated_at = timezone('utc'::text, now())
        WHERE user_id = NEW.user_id;

        -- Create atomic audit log entry
        INSERT INTO public.wallet_refund_logs (
            refund_reference,
            ticket_id,
            user_id,
            order_id,
            amount_syp,
            refund_type,
            trigger_source,
            previous_balance_syp,
            new_balance_syp,
            reason
        ) VALUES (
            v_ref_code,
            NEW.id,
            NEW.user_id,
            NEW.order_id,
            NEW.refund_amount_syp,
            CASE WHEN NEW.auto_refund_triggered THEN 'instant_auto_refund' ELSE 'admin_approved_refund' END,
            'policy_engine',
            v_current_balance,
            v_new_balance,
            COALESCE(NEW.subject, 'استرداد قيمة السلة تلقائياً لتعذر الاستلام')
        );

        -- Auto-append system audit message to the ticket thread
        INSERT INTO public.ticket_messages (
            ticket_id,
            sender_type,
            sender_name,
            message_text
        ) VALUES (
            NEW.id,
            'system',
            'نظام المحفظة الآلي',
            'تم إيداع مبلغ الاسترداد (' || to_char(NEW.refund_amount_syp, 'FM999,999,999') || ' ل.س) بنجاح في محفظة المستهلك. رقم المرجع: ' || v_ref_code
        );

        -- Record resolution time if not set
        IF NEW.resolved_at IS NULL THEN
            NEW.resolved_at := timezone('utc'::text, now());
            NEW.resolution_speed_seconds := EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.created_at))::INT;
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind Trigger to support_tickets
DROP TRIGGER IF EXISTS trg_process_wallet_refund ON public.support_tickets;
CREATE TRIGGER trg_process_wallet_refund
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.fn_process_instant_wallet_refund();

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_refund_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Customers can view only their own tickets
CREATE POLICY "Customers can view their own tickets"
ON public.support_tickets FOR SELECT
USING (auth.uid() = user_id);

-- Customers can insert new support tickets
CREATE POLICY "Customers can insert tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- System admins have full access
CREATE POLICY "Admins have full access to tickets"
ON public.support_tickets FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'email' LIKE '%@barakah-syria.com');
