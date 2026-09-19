// Supabase接続設定・認証まわりの共通処理
// index.html / mypage.html の両方から読み込まれる（app.js / mypage.js より先に読み込むこと）

const SUPABASE_URL = "https://ldimoyivisbhwvyqyzxb.supabase.co";
const SUPABASE_KEY = "sb_publishable_OgjuAKEaxD7njmRiTF65LQ_Bvas7rr0";

const { createClient } = window.supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const AVATAR_OPTIONS = [
    "fox_01.png",
    "fox_02.png",
    "fox_03.png",
    "fox_04.png",
    "fox_05.png",
    "fox_06.png",
    "fox_07.png",
];

async function getCurrentSession() {
    const { data } = await sb.auth.getSession();
    return data.session;
}

async function getProfile(userId) {
    const { data, error } = await sb
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) {
        console.error(error);
        return null;
    }
    return data;
}

async function signUpWithEmail(email, password) {
    return sb.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: window.location.origin + window.location.pathname.replace(/[^/]+$/, "") + "index.html",
        },
    });
}

async function signInWithEmail(email, password) {
    return sb.auth.signInWithPassword({ email, password });
}

async function signOut() {
    return sb.auth.signOut();
}
