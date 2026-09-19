// マイページ（ユーザー名・アイコンの編集）
// auth.js を先に読み込んでおくこと

let currentUser = null;
let selectedAvatar = "fox_01.png";

function renderAvatarPicker() {
    const picker = document.getElementById("avatar-picker");
    picker.innerHTML = "";

    AVATAR_OPTIONS.forEach((file) => {
        const img = document.createElement("img");
        img.className = "avatar-option";
        img.src = "img/" + file;
        img.alt = file;
        img.dataset.file = file;
        if (file === selectedAvatar) {
            img.classList.add("is-selected");
        }
        img.addEventListener("click", () => {
            selectedAvatar = file;
            document.querySelectorAll(".avatar-option").forEach((el) => {
                el.classList.toggle("is-selected", el.dataset.file === selectedAvatar);
            });
        });
        picker.appendChild(img);
    });
}

async function handleSave() {
    const usernameInput = document.getElementById("username");
    const errorEl = document.getElementById("mypage-error");
    const noteEl = document.getElementById("mypage-note");
    const saveBtn = document.getElementById("save-btn");

    errorEl.hidden = true;
    noteEl.hidden = true;

    const username = usernameInput.value.trim();
    if (username.length > 30) {
        errorEl.textContent = "ユーザー名は30文字以内で入力してください。";
        errorEl.hidden = false;
        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "保存中…";

    const { error } = await sb
        .from("profiles")
        .update({ username: username || null, avatar: selectedAvatar })
        .eq("id", currentUser.id);

    saveBtn.disabled = false;
    saveBtn.textContent = "保存する";

    if (error) {
        errorEl.textContent = "保存に失敗しました。もう一度試してください。";
        errorEl.hidden = false;
        console.error(error);
        return;
    }

    noteEl.textContent = "保存しました！";
    noteEl.hidden = false;
}

async function handleLogout() {
    await signOut();
    window.location.href = "index.html";
}

async function init() {
    const session = await getCurrentSession();

    if (!session) {
        document.getElementById("not-logged-in").hidden = false;
        document.getElementById("mypage-content").hidden = true;
        return;
    }

    currentUser = session.user;
    document.getElementById("not-logged-in").hidden = true;
    document.getElementById("mypage-content").hidden = false;
    document.getElementById("mypage-email").textContent = currentUser.email;

    const profile = await getProfile(currentUser.id);
    if (profile) {
        document.getElementById("username").value = profile.username || "";
        selectedAvatar = profile.avatar || "fox_01.png";
    }

    renderAvatarPicker();
}

document.getElementById("save-btn").addEventListener("click", handleSave);
document.getElementById("logout-btn").addEventListener("click", handleLogout);

init();
