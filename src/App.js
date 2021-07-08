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
    <div
      style={{
        marginTop: "50vh",
        transform: "translateY(-100%)",
        flexGrow: 1,
        margin: "auto",
      }}
    >
      <h1>Planning Poker</h1>
      <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
    </div>
  );
}

async function createGame(user, freestyle) {
  const game = await firebase
    .firestore()
    .collection("game")
    .add({
      owner: user.uid,
      name: `${user.displayName}'s Planning Poker`,
      activeTask: null,
      deck: freestyle ? null : [1, 2, 3, 5, 8, 13, 21],
      created: firebase.firestore.Timestamp.now(),
    });
  game.collection("members").doc(user.uid).set({
    name: user.displayName,
  });
  window.location.search = game.id;
}

export function CreateGameForm({ user }) {
  const [games] = useCollection(
    firebase.firestore().collection("game").orderBy("created", "desc").limit(10)
  );
  return (
    <div style={{ margin: "auto" }}>
      <h1>Welcome, {user.displayName}!</h1>
      <button onClick={() => createGame(user, false)}>Start a new game</button>
      <button className="Secondary" onClick={() => createGame(user, true)}>
        Freestyle
      </button>
      <h2>Join Game</h2>
      <div>
        {games
          ? games.docs.map((game) => (
              <div
                onClick={() => (window.location.search = game.id)}
                className="GameEntry"
              >
                {game.data().name} (
                {game.data().created.toDate().toLocaleString()})
              </div>
            ))
          : null}
      </div>
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "20vw",
        fontSize: "18px",
      }}
    >
      <div>
        {members.docs.map((doc) => {
          const isMe = user.uid === doc.id;
          return (
            <div
              style={{
                ...(isMe ? { fontWeight: "bold" } : {}),
                ...{ margin: "8px 12px", display: "flex" },
              }}
            >
              <div style={{ marginRight: "auto" }}>{doc.data().name} </div>
              <div>
                {isMe && scoreData
                  ? scoreData[user.uid]
                  : revealed
                  ? scoreData[doc.id]
                  : scoreData[doc.id]
                  ? "✔️"
                  : ""}
              </div>
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
      <div style={{ display: "flex", backgroundColor: "#f0f0f0" }}>
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
                    className="TaskEntry"
                  >
                    {doc.data().name}
                  </div>
                ))
              : null}
            <input
              placeholder="+ Add Task"
              onChange={(event) => setNewTask(event.value)}
              value={newTask}
              style={{ marginTop: 16 }}
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
              <input
                placeholder="Ticket"
                value={ticket}
                onChange={(e) => setTicket(e.currentTarget.value)}
                pattern="T\d+"
                type="text"
                onKeyPress={async (e) => {
                  if (e.key === "Enter" && e.currentTarget.checkValidity()) {
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
                  }
                }}
              ></input>
            ) : null}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "60vw",
            background: "white",
            height: "auto",
          }}
        >
          {activeTask ? (
            <>
              <h1 style={{ padding: "38px" }}>{activeTask.data().name}</h1>
              <div style={{ margin: "32px" }}>
                {game.data().deck ? (
                  [...game.data().deck, "?"].map((card) => {
                    return (
                      <button
                        className={`Card ${
                          scores &&
                          scores.data() &&
                          card === scores.data()[user.uid]
                            ? "SelectedCard"
                            : ""
                        }`}
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
                    );
                  })
                ) : (
                  <input
                    placeholder="Score"
                    pattern="\d+"
                    onKeyPress={async (e) => {
                      if (
                        e.key === "Enter" &&
                        e.currentTarget.checkValidity()
                      ) {
                        game.ref
                          .collection("scores")
                          .doc(activeTaskId)
                          .set(
                            {
                              [user.uid]: parseInt(e.currentTarget.value),
                            },
                            { merge: true }
                          );
                      }
                    }}
                  ></input>
                )}
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
                      className="Secondary"
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
                      className="Secondary"
                    >
                      Skip
                    </button>
                    <button
                      onClick={() => {
                        activeTask.ref.set({ revealed: true }, { merge: true });
                        setPoints(
                          scores
                            ? Math.round(
                                average(
                                  Object.values(scores.data()).filter(
                                    (score) => score !== "?"
                                  )
                                )
                              )
                            : 0
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
                  <div style={{ marginTop: "32px" }}>
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
                      className="InputButton"
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
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
        }}
      >
        <button
          onClick={() =>
            gameDoc.collection("members").doc(user.uid).set({
              name: user.displayName,
            })
          }
          style={{ transform: "translateY(-100%)", margin: "auto" }}
        >
          Join Session
        </button>
      </div>
    );
  }
}

function Interface({ id, user }) {
  const settingsDoc = firebase.firestore().collection("settings").doc(user.uid);
  const [settings] = useCollection(settingsDoc);
  const darkMode = settings?.data()?.darkMode;
  return (
    <div
      style={{
        ...(darkMode ? { filter: "invert(0.95)" } : {}),
        ...{ display: "flex", flexGrow: 1, background: "white" },
      }}
    >
      {id ? <Game id={id} user={user} /> : <CreateGameForm user={user} />}
      <button
        className="Secondary"
        style={{ position: "absolute", right: 0, bottom: 0, color: "grey" }}
        onClick={() => {
          settingsDoc.set({ darkMode: !darkMode }, { merge: true });
        }}
      >
        {darkMode ? "Light Mode" : "Dark Mode"}
      </button>
    </div>
  );
}

function App() {
  const [user] = useAuthState(firebase.auth());
  const gameId = window.location.search
    ? window.location.search.slice(1)
    : null;
  return (
    <div className="App">
      {user ? <Interface id={gameId} user={user} /> : <LoggedOutTemplate />}
    </div>
  );
}

export default App;
