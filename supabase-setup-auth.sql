-- コンちゃん掲示板 - ログイン機能・マイページ用SQL
-- Supabaseダッシュボードの「SQL Editor」に貼り付けて実行してください
-- （すでに posts テーブルは作成済みという前提です）

-- ============================================
-- プロフィールテーブル（ユーザー名・アイコン）
-- ============================================
create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text check (char_length(username) <= 30),
    avatar text not null default 'fox_01.png',
    created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "誰でもプロフィールを閲覧できる"
    on profiles for select
    using (true);

create policy "本人だけ自分のプロフィールを更新できる"
    on profiles for update
    using (auth.uid() = id);

-- 新規登録時に自動でプロフィール行を作る
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- ============================================
-- posts テーブルの更新（投稿者と紐づける）
-- ============================================
alter table posts add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table posts add column if not exists avatar text not null default 'fox_01.png';

-- 「誰でも投稿できる」ポリシーを削除し、ログインユーザーのみに変更
drop policy if exists "誰でも投稿を作成できる" on posts;

create policy "ログインユーザーは自分の投稿を作成できる"
    on posts for insert
    with check (auth.uid() = user_id);
