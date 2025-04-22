import store from "../app/store";
import {
  signIn,
  signOut,
  errorOccured,
  loadingFinished,
  loadingStarted,
} from "../features/user/userSlice";
import {
  currentUserUpdated,
  currentUserLoggedOut,
} from "../features/currentUser/currentUserSlice";
import { usersUpdated, usersDeleted } from "../features/users/usersSlice";
import { postsUpdated } from "../features/posts/postsSlice";
import {
  incomingMessagesDeleted,
  incomingMessagesUpdated,
} from "../features/incomingMessages/incomingMessagesSlice";
import {
  outgoingMessagesDeleted,
  outgoingMessagesUpdated,
} from "../features/outgoingMessages/outgoingMessagesSlice";

//The following global variables get values, when the UserAccount component renders and runs
//subscribeCurrentUser. After that we use them globally in the following functions.
let userID;
let token;

// SignalR Websockets code

// URL to handle Websockets
const SOCKETS_URL = "https://alexerdei-team.us.ainiro.io/sockets";

import * as signalR from "@microsoft/signalr";

let builder = new signalR.HubConnectionBuilder();

let connection;

function buildConnection(token) {
  connection = builder
    .withUrl(SOCKETS_URL, {
      accessTokenFactory: () => token.split(" ")[1],
      skipNegotiation: true,
      transport: signalR.HttpTransportType.WebSockets,
    })
    .withAutomaticReconnect()
    .build();
}

async function startConnection() {
  await connection.start().catch((err) => console.error(err.toString()));
}
// End of websockets code

// Code from the image-storage project to handle the authentication and storage
const BASE_URL = "https://alexerdei-team.us.ainiro.io/magic/modules/fakebook/";

async function getJSON(response) {
  let json;
  try {
    json = await response.json();
  } catch (error) {
    json = [];
  }
  if (response.status > 299) throw Error(json.message);
  return json;
}

async function register(user) {
  try {
    const response = await fetch(`${BASE_URL}register`, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });
    return await getJSON(response);
  } catch (error) {
    return { error };
  }
}

async function login(user) {
  const { email, password } = user;
  const response = await fetch(
    `${BASE_URL}login?email=${email}&password=${password}`,
    {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return await getJSON(response);
}

async function uploadFile(file, token) {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const response = await fetch(`${BASE_URL}image`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: token,
      },
      body: formData,
    });
    return await getJSON(response);
  } catch (error) {
    return { error };
  }
}

// end of back-end code from the image-storage project

async function getTable(table, token) {
  try {
    const response = await fetch(`${BASE_URL}${table}?limit=-1`, {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });
    return await getJSON(response);
  } catch (error) {
    return { error };
  }
}

// Handle fakebook specific endpoints

async function updateUser(id, token, body) {
  body.user_id = id;
  if (body.isOnline) body.isOnline = Number(body.isOnline);
  if (body.photos) body.photos = JSON.stringify(body.photos);
  if (body.posts) body.posts = JSON.stringify(body.posts);
  try {
    const response = await fetch(`${BASE_URL}users`, {
      method: "PUT",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(body),
    });
    return await getJSON(response);
  } catch (error) {
    return { error };
  }
}

async function postPosts(token, body) {
  try {
    const response = await fetch(`${BASE_URL}posts`, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(body),
    });
    return await getJSON(response);
  } catch (error) {
    return { error };
  }
}

async function putPost(id, token, body) {
  let payload = {};
  payload.post_id = id;
  if (body.likes) payload.likes = JSON.stringify(body.likes);
  if (body.comments) payload.comments = JSON.stringify(body.comments);
  try {
    const response = await fetch(`${BASE_URL}posts`, {
      method: "PUT",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(payload),
    });
    return await getJSON(response);
  } catch (error) {
    return { error };
  }
}

async function postMessages(token, body) {
  try {
    const response = await fetch(`${BASE_URL}message`, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(body),
    });
    return await getJSON(response);
  } catch (error) {
    return { error };
  }
}

async function getMessages(id, token, isSender) {
  try {
    const idField = isSender ? "sender" : "recipient";
    const response = await fetch(
      `${BASE_URL}message?limit=-1&message.${idField}.eq=${id}`,
      {
        method: "GET",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      }
    );
    return await getJSON(response);
  } catch (error) {
    return { error };
  }
}

function putMessages(id, token, body) {
  const payload = {};
  payload.message_id = id;
  payload.isRead = Number(body.isRead);
  return fetch(`${BASE_URL}message`, {
    method: "PUT",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify(payload),
  });
}

async function getPswReminderEmail(email) {
  const response = await fetch(`${BASE_URL}pswreminder?email=${email}`, {
    method: "GET",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return await getJSON(response);
}

// Handling fakebook specific endpoints over

async function getAllDataFromServer(id, token) {
  const promises = [
    getTable("users", token),
    getTable("posts", token),
    getMessages(id, token, true),
    getMessages(id, token, false),
  ];
  return await Promise.all(promises);
}

export async function subscribeAuth() {
  let user = localStorage.getItem("user");
  if (user) {
    user = JSON.parse(user);
    const id = user.user_id;
    const isEmailVerified = true;
    const token = user.token;
    let users = store.getState().users;
    try {
      if (!users || users.length === 0) {
        const [usrs, posts, outgoingMessages, incomingMessages] =
          await getAllDataFromServer(id, token);
        users = usrs;
        store.dispatch(usersUpdated(users));
        store.dispatch(postsUpdated(posts));
        store.dispatch(outgoingMessagesUpdated(outgoingMessages));
        store.dispatch(incomingMessagesUpdated(incomingMessages));
      }
      const userData = users.filter((user) => user.userID === id)[0];
      const { firstname, lastname } = userData;
      store.dispatch(currentUserUpdated(userData));
      const displayName = `${firstname} ${lastname}`;
      store.dispatch(signIn({ id, displayName, isEmailVerified }));
      if (!connection) {
        buildConnection(token);
        await startConnection();
      }
    } catch (error) {
      localStorage.removeItem("user");
      store.dispatch(errorOccured(error.message));
      store.dispatch(signOut());
    }
  } else {
    store.dispatch(signOut());
  }
  store.dispatch(loadingFinished());
}

export function subscribeCurrentUser() {
  const user = store.getState().user;
  userID = user.id; //These are
  token = JSON.parse(localStorage.getItem("user")).token; // global values
  connection.on("fakebook.users.put", (args) => {
    const data = JSON.parse(args);
    if (data.user_id !== userID) return;
    store.dispatch(currentUserUpdated(data));
  });
  return () => connection.off("fakebook.users.put");
}

export async function currentUserOnline() {
  await updateUser(userID, token, { isOnline: true });
}

export async function currentUserOffline() {
  await updateUser(userID, token, { isOnline: false });
}

export function subscribeUsers() {
  connection.on("fakebook.users.put", (args) => {
    const data = JSON.parse(args);
    store.dispatch(usersUpdated([data]));
  });
  connection.on("fakebook.users.post", (args) => {
    const data = JSON.parse(args);
    store.dispatch(usersUpdated([data]));
  });
  return () => {
    connection.off("fakebook.users.put");
    connection.off("fakebook.users.post");
  };
}

export async function signUserOut() {
  store.dispatch(loadingStarted());
  await currentUserOffline();
  store.dispatch(currentUserLoggedOut());
  store.dispatch(usersDeleted());
  store.dispatch(incomingMessagesDeleted());
  store.dispatch(outgoingMessagesDeleted());
  localStorage.removeItem("user");
  store.dispatch(loadingFinished());
  subscribeAuth();
}

export function subscribePosts() {
  connection.on("fakebook.posts.put", (args) => {
    const data = JSON.parse(args);
    store.dispatch(postsUpdated([data]));
  });
  connection.on("fakebook.posts.post", (args) => {
    const data = JSON.parse(args);
    store.dispatch(postsUpdated([data]));
  });
  return () => {
    connection.off("fakebook.posts.put");
    connection.off("fakebook.posts.post");
  };
}

export function subscribeMessages(typeOfMessages) {
  let typeOfUser;
  let actionCreator;
  if (typeOfMessages === "incoming") {
    typeOfUser = "recipient";
    actionCreator = incomingMessagesUpdated;
  } else {
    typeOfUser = "sender";
    actionCreator = outgoingMessagesUpdated;
  }
  connection.on("fakebook.message.post", (args) => {
    const data = JSON.parse(args);
    if (data[typeOfUser] !== userID) return;
    store.dispatch(actionCreator([data]));
  });
  if (typeOfMessages === "incoming") {
    getMessages(userID, token, false).then((incomingMessages) =>
      store.dispatch(incomingMessagesUpdated(incomingMessages))
    );
    connection.on("fakebook.message.put", (args) => {
      const data = JSON.parse(args);
      const recipient = store
        .getState()
        .incomingMessages.find(
          (msg) => msg.messageID === data.message_id
        ).recipient;
      if (recipient !== userID) return;
      store.dispatch(actionCreator([data]));
    });
  }
  return () => {
    connection.off("fakebook.message.put");
    connection.off("fakebook.message.post");
  };
}

export async function createUserAccount(user) {
  try {
    await register(user);
    console.log("Verification email has been sent.");
  } catch (error) {
    // Update the error
    store.dispatch(errorOccured(error.message));
    console.log(error.message);
  }
}

export async function signInUser(user) {
  const EMAIL_VERIFICATION_ERROR =
    "Please verify your email before to continue";
  try {
    const response = await login(user);
    response.token = `Bearer ${response.token}`;
    localStorage.setItem("user", JSON.stringify(response));
  } catch (error) {
    // Email is not verified
    if (error.message.indexOf("email") !== -1) {
      store.dispatch(errorOccured(EMAIL_VERIFICATION_ERROR));
      localStorage.removeItem("user");
    } else {
      // Update the error
      store.dispatch(errorOccured(error.message));
    }
  } finally {
    subscribeAuth();
  }
}

export async function sendPasswordReminder(email) {
  return await getPswReminderEmail(email);
}

function getPostID() {
  const posts = store.getState().posts;
  let isDuplicated = true;
  let id;
  while (isDuplicated) {
    id = Math.random().toString(36).slice(2, 12);
    isDuplicated = posts.map((post) => post.postID).indexOf(id) !== -1;
  }
  return id;
}

function getMessageID() {
  const messages = store.getState().outgoingMessages;
  let isDuplicated = true;
  let id;
  while (isDuplicated) {
    id = Math.random().toString(36).slice(2, 12);
    isDuplicated =
      messages.map((message) => message.messageID).indexOf(id) !== -1;
  }
  return id;
}

export async function upload(post) {
  post.post_id = getPostID();
  post.isYoutube = Number(post.isYoutube);
  post.isPhoto = Number(post.isPhoto);
  post.likes = JSON.stringify(post.likes);
  post.comments = JSON.stringify(post.comments) || "[]";
  post.user_id = post.userID;
  delete post.userID;
  await postPosts(token, post);
  const postID = post.post_id;
  updateUserPosts(postID);
}

function updateUserPosts(postID) {
  const user = store.getState().currentUser;
  let newPosts;
  if (user.posts) newPosts = [...user.posts];
  else newPosts = [];
  newPosts.unshift(postID);
  updateUser(userID, token, {
    posts: newPosts,
  });
}

export function updatePost(post, postID) {
  putPost(postID, token, post);
}

export async function addFileToStorage(file) {
  await uploadFile(file, token);
  return file;
}

export function updateProfile(profile) {
  updateUser(userID, token, profile);
}

export async function uploadMessage(msg) {
  msg.message_id = getMessageID();
  msg.isPhoto = Number(msg.isPhoto);
  msg.isRead = Number(msg.isRead);
  msg.sender = userID;
  delete msg.messageID;
  await postMessages(token, msg);
}

export function updateToBeRead(messageID) {
  return putMessages(messageID, token, { isRead: true });
}
