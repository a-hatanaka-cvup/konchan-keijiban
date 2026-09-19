// 掲示板のメイン処理（ログイン状態の表示・投稿一覧・投稿フォーム）
// auth.js を先に読み込んでおくこと（sb, getCurrentSession, getProfile などを使う）

const CARD_COLORS = ["post-card--orange", "post-card--blue", "post-card--pink", "post-card--green"];

let currentUser = null;
let currentProfile = null;

function formatDate(iso) {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ============================================
// 投稿一覧
// ============================================
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

        const avatar = document.createElement("img");
        avatar.className = "post-avatar";
        avatar.src = "img/" + (post.avatar || "fox_01.png");
        avatar.alt = "投稿者のアイコン";

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

        const textWrap = document.createElement("div");
        textWrap.className = "post-card-text";
        textWrap.appendChild(head);
        textWrap.appendChild(body);

        li.appendChild(avatar);
        li.appendChild(textWrap);
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

async function handlePostSubmit(event) {
    event.preventDefault();

    const messageInput = document.getElementById("message");
    const errorEl = document.getElementById("form-error");
    const submitBtn = document.getElementById("submit-btn");

    const message = messageInput.value.trim();

    errorEl.hidden = true;

    if (!currentUser) {
        errorEl.textContent = "投稿するにはログインしてください。";
        errorEl.hidden = false;
        return;
    }
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

    const name = (currentProfile && currentProfile.username) || "名無しさん";
    const avatar = (currentProfile && currentProfile.avatar) || "fox_01.png";

    const { error } = await sb.from("posts").insert({
        name,
        message,
        avatar,
        user_id: currentUser.id,
    });

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

// ============================================
// ログイン状態の表示切り替え
// ============================================
function showLoggedInUI() {
    document.getElementById("auth-loggedin").hidden = false;
    document.getElementById("auth-loggedout").hidden = true;
    document.getElementById("post-form").hidden = false;
    document.getElementById("post-form-locked").hidden = true;

    const name = (currentProfile && currentProfile.username) || currentUser.email;
    document.getElementById("auth-greeting").textContent = `ようこそ、${name}さん！`;
    document.getElementById("auth-avatar").src = "img/" + ((currentProfile && currentProfile.avatar) || "fox_01.png");
}

function showLoggedOutUI() {
    document.getElementById("auth-loggedin").hidden = true;
    document.getElementById("auth-loggedout").hidden = false;
    document.getElementById("post-form").hidden = true;
    document.getElementById("post-form-locked").hidden = false;
}

async function refreshAuthUI() {
    const session = await getCurrentSession();

    if (session) {
        currentUser = session.user;
        currentProfile = await getProfile(currentUser.id);
        showLoggedInUI();
    } else {
        currentUser = null;
        currentProfile = null;
        showLoggedOutUI();
    }
}

// ============================================
// ログイン／新規登録フォーム
// ============================================
let authMode = "login";

function setAuthMode(mode) {
    authMode = mode;
    document.getElementById("tab-login").classList.toggle("is-active", mode === "login");
    document.getElementById("tab-signup").classList.toggle("is-active", mode === "signup");
    document.getElementById("auth-password-confirm-row").hidden = mode !== "signup";
    document.getElementById("auth-submit-btn").textContent = mode === "signup" ? "新規登録" : "ログイン";
    document.getElementById("auth-error").hidden = true;
    document.getElementById("auth-note").hidden = true;
}

async function handleAuthSubmit(event) {
    event.preventDefault();

    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    const errorEl = document.getElementById("auth-error");
    const noteEl = document.getElementById("auth-note");
    const submitBtn = document.getElementById("auth-submit-btn");

    errorEl.hidden = true;
    noteEl.hidden = true;

    if (authMode === "signup") {
        const confirm = document.getElementById("auth-password-confirm").value;
        if (password !== confirm) {
            errorEl.textContent = "パスワードが一致しません。";
            errorEl.hidden = false;
            return;
        }
    }

    submitBtn.disabled = true;

    if (authMode === "signup") {
        const { error } = await signUpWithEmail(email, password);
        submitBtn.disabled = false;

        if (error) {
            errorEl.textContent = "登録に失敗しました：" + error.message;
            errorEl.hidden = false;
            return;
        }

        noteEl.textContent = "確認メールを送信しました。メール内のリンクをクリックしてログインを完了してください。";
        noteEl.hidden = false;
        return;
    }

    const { error } = await signInWithEmail(email, password);
    submitBtn.disabled = false;

    if (error) {
        errorEl.textContent = "ログインに失敗しました：" + error.message;
        errorEl.hidden = false;
        return;
    }

    document.getElementById("auth-form").reset();
    await refreshAuthUI();
}

async function handleLogout() {
    await signOut();
    await refreshAuthUI();
}

// ============================================
// 初期化
// ============================================
document.getElementById("tab-login").addEventListener("click", () => setAuthMode("login"));
document.getElementById("tab-signup").addEventListener("click", () => setAuthMode("signup"));
document.getElementById("auth-form").addEventListener("submit", handleAuthSubmit);
document.getElementById("logout-btn").addEventListener("click", handleLogout);
document.getElementById("post-form").addEventListener("submit", handlePostSubmit);

sb.auth.onAuthStateChange(() => {
    refreshAuthUI();
});

refreshAuthUI();
loadPosts();
