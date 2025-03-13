import store from "../app/store";
import {
	signIn,
	signOut,
	errorOccured,
	loadingFinished,
	loadingStarted,
} from "../features/user/userSlice";
import { currentUserUpdated } from "../features/currentUser/currentUserSlice";
import { usersUpdated } from "../features/users/usersSlice";
import { postsUpdated } from "../features/posts/postsSlice";
import { incomingMessagesUpdated } from "../features/incomingMessages/incomingMessagesSlice";
import { outgoingMessagesUpdated } from "../features/outgoingMessages/outgoingMessagesSlice";

// URL of my website.
const FAKEBOOK_URL = "https://alexerdei73.github.io/fakebook-ainoro/";

/*firebase.initializeApp(firebaseConfig);

const appCheck = firebase.appCheck();
// Pass your reCAPTCHA v3 site key (public key) to activate(). Make sure this
// key is the counterpart to the secret key you set in the Firebase console.
appCheck.activate(
  "6LfCG9UhAAAAAL8vSI4Hbustx8baJEDMA0Sz1zD2",

  // Optional argument. If true, the SDK automatically refreshes App Check
  // tokens as needed.
  true
);

const storage = firebase.storage();*/

// Code from the image-storage project to handle the authentication and storage
const BASE_URL = "https://alexerdei-team.us.ainiro.io/magic/modules/fakebook/";
// URL to handle Websockets
const SOCKETS_URL = "https://alexerdei-team.us.ainiro.io/sockets";

// SignalR Websockets code
import * as signalR from "@microsoft/signalr";

let builder = new signalR.HubConnectionBuilder();

let connection = builder
	.withUrl(SOCKETS_URL, {
		//accessTokenFactory: () => JSON.parse(localStorage.getItem("user")).token,
		skipNegotiation: true,
		transport: signalR.HttpTransportType.WebSockets,
	})
	.build();

connection.start().catch((err) => console.error(err.toString()));

// End of websockets code

async function getJSON(response) {
	const json = await response.json();
	if (response.status > 299) throw Error(json.message);
	return json;
}

async function getBlob(response) {
	if (response.status > 299) {
		const json = await response.json();
		throw Error(json.message);
	}
	return await response.blob();
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

/*async function upload(file, token) {
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
}*/

async function getStorage(token) {
	try {
		const response = await fetch(`${BASE_URL}storage`, {
			method: "GET",
			mode: "cors",
			headers: {
				Authorization: token,
			},
		});
		return await getJSON(response);
	} catch (error) {
		return { error };
	}
}

async function downloadFile(folder, filename, token) {
	try {
		const response = await fetch(
			`${BASE_URL}image?folder=${folder}&filename=${filename}`,
			{
				method: "GET",
				mode: "cors",
				headers: {
					Authorization: token,
				},
			}
		);
		return await getBlob(response);
	} catch (error) {
		return { error };
	}
}

async function deleteFile(folder, filename, token) {
	try {
		const response = await fetch(
			`${BASE_URL}image?folder=${folder}&filename=${filename}`,
			{
				method: "DELETE",
				mode: "cors",
				headers: {
					Authorization: token,
				},
			}
		);
		return await getJSON(response);
	} catch (error) {
		return { error };
	}
}
// end of back-end code from the image-storage project

async function getUsers(token) {
	try {
		const response = await fetch(`${BASE_URL}users`, {
			method: "GET",
			mode: "cors",
			headers: {
				Authorization: token,
			},
		});
		return await getJSON(response);
	} catch (error) {
		return { error };
	}
}

async function updateUser(id, token, body) {
	body.user_id = id;
	body.isOnline = Number(body.isOnline);
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

export async function getImageURL(imagePath) {
	const imageRef = storage.ref(imagePath);
	const url = await imageRef.getDownloadURL();
	return url;
}

//const auth = firebase.auth();

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
				users = await getUsers(token);
				store.dispatch(usersUpdated(users));
				//users = store.getState().users;
				//console.log(users);
			}
			console.log(users);
			const userData = users.filter((user) => user.userID === id);
			const { firstname, lastname } = userData;
			const displayName = `${firstname} ${lastname}`;
			store.dispatch(signIn({ id, displayName, isEmailVerified }));
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

/*const firestore = firebase.firestore();

const usersCollection = firestore.collection("users");*/

//The following global variables get values, when the UserAccount component renders and runs
//subscribeCurrentUser. After that we use them globally in the following functions.
let userID;
let userDocRef;
let token;

export function subscribeCurrentUser() {
	userID = store.getState().user.id; //This are
	token = JSON.parse(localStorage.getItem("user")).token; // global values
	console.log(userID, token);
	connection.on("fakebook.users.put", (args) => {
		const data = JSON.parse(args);
		if (data.user_id !== userID) return;
		console.log(data);
		store.dispatch(currentUserUpdated(data));
	});
}

export async function currentUserOnline() {
	console.log(userID, token);
	await updateUser(userID, token, { isOnline: 1 });
}

export async function currentUserOffline() {
	await updateUser(userID, token, { isOnline: 0 });
}

export function subscribeUsers() {
	connection.on("fakebook.users.put", (args) => {
		const data = JSON.parse(args);
		console.log(data);
		store.dispatch(usersUpdated([data]));
	});
	connection.on("fakebook.users.push", (args) => {
		const data = JSON.parse(args);
		console.log(data);
		store.dispatch(usersUpdated([data]));
	});
}

export async function signUserOut() {
	store.dispatch(loadingStarted());
	await currentUserOffline();
	//await auth.signOut();
	localStorage.removeItem("user");
	store.dispatch(loadingFinished());
	subscribeAuth();
}

export function subscribePosts() {
	return;
	const postsCollection = firestore.collection("posts");
	return postsCollection.orderBy("timestamp", "desc").onSnapshot((snapshot) => {
		const posts = [];
		snapshot.forEach((post) => {
			const postData = post.data();
			const timestamp = postData.timestamp;
			let dateString = "";
			if (timestamp) dateString = timestamp.toDate().toLocaleString();
			postData.timestamp = dateString;
			postData.postID = post.id;
			posts.push(postData);
		});
		store.dispatch(postsUpdated(posts));
	});
}

export function subscribeMessages(typeOfMessages) {
	return;
	let typeOfUser;
	let actionCreator;
	if (typeOfMessages === "incoming") {
		typeOfUser = "recipient";
		actionCreator = incomingMessagesUpdated;
	} else {
		typeOfUser = "sender";
		actionCreator = outgoingMessagesUpdated;
	}
	const messagesCollection = firestore
		.collection("messages")
		.where(typeOfUser, "==", userID);
	return messagesCollection.onSnapshot((snapshot) => {
		const messages = [];
		snapshot.forEach((message) => {
			const messageData = message.data();
			const timestamp = message.data().timestamp;
			let dateString;
			if (timestamp) dateString = timestamp.toDate().toISOString();
			else dateString = "";
			messageData.timestamp = dateString;
			messageData.id = message.id;
			if (dateString !== "") messages.push(messageData);
		});
		store.dispatch(actionCreator(messages));
	});
}

export async function createUserAccount(user) {
	try {
		const result = await auth.createUserWithEmailAndPassword(
			user.email,
			user.password
		);
		// Update the nickname
		await result.user.updateProfile({
			displayName: `${user.firstname} ${user.lastname}`,
		});
		// get the index of the new user with the same username
		const querySnapshot = await firestore
			.collection("users")
			.where("firstname", "==", user.firstname)
			.where("lastname", "==", user.lastname)
			.get();
		const index = querySnapshot.size;
		// Create firestore document
		await firestore.collection("users").doc(result.user.uid).set({
			firstname: user.firstname,
			lastname: user.lastname,
			profilePictureURL: "fakebook-avatar.jpeg",
			backgroundPictureURL: "background-server.jpg",
			photos: [],
			posts: [],
			isOnline: false,
			index: index,
		});
		// Sign out the user
		await firebase.auth().signOut();
		// Send Email Verification and redirect to my website.
		await result.user.sendEmailVerification(FAKEBOOK_URL);
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
	//const NO_ERROR = "";
	try {
		const response = await login(user);
		response.token = `Bearer ${response.token}`;
		localStorage.setItem("user", JSON.stringify(response));
		subscribeAuth();
	} catch (error) {
		// Email is not verified
		if (error.message.indexOf("email") !== -1) {
			store.dispatch(errorOccured(EMAIL_VERIFICATION_ERROR));
			localStorage.removeItem("user");
			subscribeAuth();
		} else {
			// Update the error
			store.dispatch(errorOccured(error.message));
		}
	}
}

export function sendPasswordReminder(email) {
	return auth.sendPasswordResetEmail(email);
}

export async function upload(post) {
	return;
	const refPosts = firestore.collection("posts");
	const docRef = await refPosts.add({
		...post,
		timestamp: firebase.firestore.FieldValue.serverTimestamp(),
	});
	const postID = docRef.id;
	updateUserPosts(postID);
	return docRef;
}

function updateUserPosts(postID) {
	const user = store.getState().currentUser;
	let newPosts;
	if (user.posts) newPosts = [...user.posts];
	else newPosts = [];
	newPosts.unshift(postID);
	userDocRef.update({
		posts: newPosts,
	});
}

export function updatePost(post, postID) {
	const postRef = firestore.collection("posts").doc(postID);
	//We need to remove the timestamp, because it is stored in serializable format in the redux-store
	//so we can't write it back to firestore
	const { timestamp, ...restPost } = post;
	postRef.update(restPost);
}

export function addFileToStorage(file) {
	const ref = storage.ref(userID).child(file.name);
	return ref.put(file);
}

export function updateProfile(profile) {
	console.log(userDocRef);
	console.log(profile);
	return userDocRef.update(profile);
}

//const refMessages = firestore.collection("messages");

export function uploadMessage(msg) {
	return refMessages.add({
		...msg,
		timestamp: firebase.firestore.FieldValue.serverTimestamp(),
	});
}

export function updateToBeRead(messageID) {
	return refMessages.doc(messageID).update({ isRead: true });
}
