import "./App.css";
import firebase from "firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollection, useDocument } from "react-firebase-hooks/firestore";
import { StyledFirebaseAuth } from "react-firebaseui";
import { useState } from "react";

// Configure FirebaseUI.
const uiConfig = {
  signInFlow: "popup",
  callbacks: {
    // Avoid redirects after sign-in.
    signInSuccessWithAuthResult: () => false,
  },
  signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
};

export function LoggedOutTemplate() {
  return (
    <div css={{ marginTop: "50vh", transform: "translateY(-50%)" }}>
      <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
    </div>
  );
}

async function createGame(user) {
  const game = await firebase
    .firestore()
    .collection("game")
    .add({
      owner: user.uid,
      name: `${user.displayName}'s Planning Poker`,
      activeTask: null,
      deck: [1, 2, 3, 5, 8, 13, 21],
      created: firebase.firestore.Timestamp.now(),
    });
  game.collection("members").doc(user.uid).set({
    name: user.displayName,
  });
  window.location.search = game.id;
}

export function CreateGameForm({ user }) {
  return (
    <div>
      <h1>Welcome, {user.displayName}!</h1>
      <button onClick={() => createGame(user)}>Start a new game</button>
    </div>
  );
}

function average(nums) {
  if (!nums.length) {
    return 0;
  }
  return nums.reduce((a, b) => a + b) / nums.length;
}

function ScoreState({ game, user, activeTask, members, scores }) {
  const scoreData = (scores ? scores.data() : null) || {};
  const revealed = activeTask.data().revealed;
  if (!members) {
    return;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "20vw" }}>
      <div>
        {members.docs.map((doc) => {
          const isMe = user.uid === doc.id;
          return (
            <div style={isMe ? { fontWeight: "bold" } : {}}>
              {doc.data().name}{" "}
              {isMe && scoreData
                ? scoreData[user.uid]
                : revealed
                ? scoreData[doc.id]
                : scoreData[doc.id]
                ? "✔️"
                : ""}
            </div>
          );
        })}
      </div>
      <div>
        {revealed ? (
          <>
            Average:{" "}
            {Math.round(
              average(Object.values(scoreData).filter((score) => score !== "?"))
            )}
          </>
        ) : (
          <>
            {Object.values(scoreData).length}/{members.docs.length} Responses
          </>
        )}
      </div>
    </div>
  );
}

export function Game({ user }) {
  const gameDoc = firebase
    .firestore()
    .collection("game")
    .doc(window.location.search.slice(1));
  const [game, gameLoading] = useDocument(gameDoc);
  const [tasks, tasksLoading] = useCollection(
    gameDoc.collection("tasks").orderBy("idx")
  );
  const [newTask, setNewTask] = useState("");
  const [members, membersLoading] = useCollection(
    gameDoc.collection("members")
  );
  const [points, setPoints] = useState();
  const [ticket, setTicket] = useState("");
  const [allScores, allScoresLoading] = useCollection(
    gameDoc.collection("scores")
  );
  if (gameLoading || tasksLoading || membersLoading) {
    return null;
  }
  const activeTaskId = game.data().activeTask;
  const activeTask =
    activeTaskId && !tasksLoading
      ? tasks.docs.find((task) => task.id === activeTaskId)
      : null;
  const scores = allScoresLoading
    ? null
    : allScores.docs.find((doc) => doc.id === activeTaskId);

  const taskIndex = tasks.docs.findIndex((task) => task.id === activeTaskId);
  console.log(ticket);
  if (members.docs.find((doc) => doc.id === user.uid)) {
    return (
      <div style={{ display: "flex" }}>
        <div style={{ width: "20vw" }}>
          <h1>Tasks</h1>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {tasks
              ? tasks.docs.map((doc) => (
                  <div
                    style={
                      activeTaskId === doc.id
                        ? { fontWeight: "bold" }
                        : { color: "grey" }
                    }
                    onClick={() => {
                      game.ref.set({ activeTask: doc.id }, { merge: true });
                    }}
                  >
                    {doc.data().name}
                  </div>
                ))
              : null}
            <input
              placeholder="+ Add Task"
              onChange={(event) => setNewTask(event.value)}
              value={newTask}
              onKeyPress={async (e) => {
                if (e.key === "Enter") {
                  await gameDoc.collection("tasks").add({
                    name: e.currentTarget.value,
                    revealed: false,
                    idx: tasks.docs.length,
                  });
                  setNewTask("");
                }
              }}
            ></input>
            {document.phabricatorGetEpic ? (
              <div>
                <input
                  placeholder="Ticket"
                  value={ticket}
                  onChange={(e) => setTicket(e.currentTarget.value)}
                ></input>
                <button
                  onClick={async () => {
                    console.log(ticket);
                    const tickets = await document.phabricatorGetEpic(ticket);
                    let idx = tasks.docs.length;
                    for (const t of tickets) {
                      await gameDoc.collection("tasks").add({
                        name: `T${t.id}: ${t.fields.name}`,
                        revealed: false,
                        idx: idx++,
                      });
                    }
                    setTicket("");
                  }}
                >
                  Load Epic
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "60vw",
          }}
        >
          {activeTask ? (
            <>
              <h1>{activeTask.data().name}</h1>
              <div>
                {[...game.data().deck, "?"].map((card) => (
                  <button
                    className="Card"
                    onClick={() => {
                      game.ref
                        .collection("scores")
                        .doc(activeTaskId)
                        .set(
                          {
                            [user.uid]: card,
                          },
                          { merge: true }
                        );
                    }}
                  >
                    {card}
                  </button>
                ))}
              </div>
              <div>
                {activeTask.data().revealed &&
                game.data().owner === user.uid ? (
                  <div>
                    <button
                      onClick={() => {
                        activeTask.ref.set(
                          { revealed: false },
                          { merge: true }
                        );
                      }}
                    >
                      Hide
                    </button>
                    <button
                      disabled={taskIndex === tasks.docs.length - 1}
                      onClick={() => {
                        game.ref.set(
                          { activeTask: tasks.docs[taskIndex + 1].id },
                          { merge: true }
                        );
                      }}
                    >
                      Next
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      disabled={taskIndex === tasks.docs.length - 1}
                      onClick={() => {
                        game.ref.set(
                          { activeTask: tasks.docs[taskIndex + 1].id },
                          { merge: true }
                        );
                      }}
                    >
                      Skip
                    </button>
                    <button
                      onClick={() => {
                        activeTask.ref.set({ revealed: true }, { merge: true });
                        setPoints(
                          Math.round(
                            average(
                              Object.values(scores.data()).filter(
                                (score) => score !== "?"
                              )
                            )
                          )
                        );
                      }}
                    >
                      Reveal
                    </button>
                  </div>
                )}
                {document.phabricatorSetPoints &&
                activeTask &&
                activeTask.data().name.match(/^T\d+/) ? (
                  <div>
                    <input
                      placeholder="Points"
                      value={points}
                      onChange={(e) => setPoints(e.currentTarget.value)}
                    ></input>
                    <button
                      onClick={async () => {
                        const p = parseInt(points);
                        const ticketId = parseInt(
                          activeTask.data().name.match(/^T(\d+)/)[1]
                        );
                        await document.phabricatorSetPoints(ticketId, p);
                        setPoints("");
                      }}
                    >
                      Set Points
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <button
              disabled={tasksLoading || !tasks.docs.length}
              onClick={() =>
                game.ref.set({ activeTask: tasks.docs[0].id }, { merge: true })
              }
            >
              Start Game
            </button>
          )}
        </div>
        {activeTask ? (
          <ScoreState
            game={game}
            user={user}
            activeTask={activeTask}
            members={membersLoading ? null : members}
            scores={scores}
          />
        ) : null}
      </div>
    );
  } else {
    return (
      <button
        onClick={() =>
          gameDoc.collection("members").doc(user.uid).set({
            name: user.displayName,
          })
        }
      >
        Join Session
      </button>
    );
  }
}

function App() {
  const [user] = useAuthState(firebase.auth());
  const gameId = window.location.search
    ? window.location.search.slice(1)
    : null;
  return (
    <div className="App">
      <header className="App-header">
        {user ? (
          gameId ? (
            <Game id={gameId} user={user} />
          ) : (
            <CreateGameForm user={user} />
          )
        ) : (
          <LoggedOutTemplate />
        )}
      </header>
    </div>
  );
}

export default App;
