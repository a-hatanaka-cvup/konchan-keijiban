-- コンちゃん掲示板 - 投稿テーブル作成SQL
-- Supabaseダッシュボードの「SQL Editor」に貼り付けて実行してください

create table if not exists posts (
    id bigint generated always as identity primary key,
    name text not null default '名無しさん' check (char_length(name) <= 50),
    message text not null check (char_length(message) <= 500),
    created_at timestamptz not null default now()
);

-- 行単位セキュリティ（RLS）を有効化
alter table posts enable row level security;

-- 誰でも投稿を読める
create policy "誰でも投稿を閲覧できる"
    on posts for select
    using (true);

-- 誰でも投稿を作成できる（ログイン機能は未実装のため）
create policy "誰でも投稿を作成できる"
    on posts for insert
    with check (true);
