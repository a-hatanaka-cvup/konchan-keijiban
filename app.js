// Supabase接続設定（publishable keyはブラウザに公開しても安全な鍵です）
const SUPABASE_URL = "https://ldimoyivisbhwvyqyzxb.supabase.co";
const SUPABASE_KEY = "sb_publishable_OgjuAKEaxD7njmRiTF65LQ_Bvas7rr0";

const { createClient } = window.supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const CARD_COLORS = ["post-card--orange", "post-card--blue", "post-card--pink", "post-card--green"];

function formatDate(iso) {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderPosts(posts) {
    const list = document.getElementById("post-list");
    const status = document.getElementById("post-list-status");
    list.innerHTML = "";

    if (posts.length === 0) {
        status.hidden = false;
        status.textContent = "まだ投稿がありません。さいしょの投稿をしてみよう！";
        return;
    }
    status.hidden = true;

    posts.forEach((post, i) => {
        const li = document.createElement("li");
        li.className = "post-card " + CARD_COLORS[i % CARD_COLORS.length];

        const head = document.createElement("div");
        head.className = "post-card-head";

        const nameSpan = document.createElement("span");
        nameSpan.className = "post-name";
        nameSpan.textContent = post.name;

        const dateSpan = document.createElement("span");
        dateSpan.className = "post-date";
        dateSpan.textContent = formatDate(post.created_at);

        head.appendChild(nameSpan);
        head.appendChild(dateSpan);

        const body = document.createElement("p");
        body.className = "post-body";
        body.textContent = post.message;

        li.appendChild(head);
        li.appendChild(body);
        list.appendChild(li);
    });
}

async function loadPosts() {
    const status = document.getElementById("post-list-status");
    status.hidden = false;
    status.textContent = "読み込み中…";

    const { data, error } = await sb
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        status.hidden = false;
        status.textContent = "投稿の読み込みに失敗しました。少し時間をおいて再読み込みしてください。";
        console.error(error);
        return;
    }

    renderPosts(data);
}

async function handleSubmit(event) {
    event.preventDefault();

    const nameInput = document.getElementById("name");
    const messageInput = document.getElementById("message");
    const errorEl = document.getElementById("form-error");
    const submitBtn = document.getElementById("submit-btn");

    const name = nameInput.value.trim() || "名無しさん";
    const message = messageInput.value.trim();

    errorEl.hidden = true;

    if (!message) {
        errorEl.textContent = "コメントを入力してください。";
        errorEl.hidden = false;
        return;
    }
    if (message.length > 500) {
        errorEl.textContent = "コメントは500文字以内で入力してください。";
        errorEl.hidden = false;
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "投稿中…";

    const { error } = await sb.from("posts").insert({ name, message });

    submitBtn.disabled = false;
    submitBtn.textContent = "投稿する！";

    if (error) {
        errorEl.textContent = "投稿に失敗しました。もう一度試してください。";
        errorEl.hidden = false;
        console.error(error);
        return;
    }

    messageInput.value = "";
    await loadPosts();
}

document.getElementById("post-form").addEventListener("submit", handleSubmit);
loadPosts();
