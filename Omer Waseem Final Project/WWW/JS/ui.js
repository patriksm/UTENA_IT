const overlay = document.getElementById("overlay");
const nameInput = document.getElementById("player-name");
const joinBtn = document.getElementById("join-btn");
const errorMsg = document.getElementById("error-msg");
const statusEl = document.getElementById("status");

export function bindJoinForm(onJoin) {
  const submit = () => {
    const name = nameInput.value.trim();
    if (!name) {
      errorMsg.textContent = "Please enter your name.";
      return;
    }

    errorMsg.textContent = "";
    joinBtn.disabled = true;
    joinBtn.textContent = "Connecting…";

    onJoin(name, {
      onSuccess(player) {
        joinBtn.disabled = false;
        joinBtn.textContent = "Join game";
        overlay.classList.add("hidden");
        statusEl.textContent = `Playing as ${player.name} — click the room, then use WASD.`;
      },
      onFailure(message) {
        errorMsg.textContent = message;
        joinBtn.disabled = false;
        joinBtn.textContent = "Join game";
      },
    });
  };

  joinBtn.addEventListener("click", submit);
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });
}

export function isGameVisible() {
  return overlay.classList.contains("hidden");
}
