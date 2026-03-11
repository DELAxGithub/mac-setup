-- processed_bikes テーブルの作成
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.processed_bikes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    price NUMERIC NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS (Row Level Security) の設定
ALTER TABLE public.processed_bikes ENABLE ROW LEVEL SECURITY;

-- サービスキー（サーバーサイドからの実行）のみ許可するポリシー
CREATE POLICY "Enable all operations for authenticated users only" ON public.processed_bikes
    FOR ALL
    TO authenticated, service_role
    USING (true)
    WITH CHECK (true);
