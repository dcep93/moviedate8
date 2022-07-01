import { AllFollowType } from "./firebase";

const KEY = "moviedate8/user";
const ATTEMPTS = 3;

function User(props: { allFollow: AllFollowType }) {
  var userName = localStorage.getItem(KEY);
  if (userName === null) {
    for (let i = 0; i < ATTEMPTS; i++) {
      userName = prompt("enter your name");
      if (userName) {
        if (!props.allFollow[userName]) break;
        alert(`${userName} is taken`);
      }
    }
    if (!userName) {
      while (true) {
        userName = [...Array(8)]
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join("");
        if (!props.allFollow[userName]) break;
      }
    }
    localStorage.setItem(KEY, userName!);
  }
  return (
    <>
      <div>{userName}</div>
      <button
        onClick={() => {
          localStorage.removeItem(KEY);
          window.location.reload();
        }}
      >
        Log Out
      </button>
    </>
  );
}

export default User;
