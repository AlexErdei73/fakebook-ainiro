import { createSlice } from "@reduxjs/toolkit";

export const currentUserSlice = createSlice({
	name: "currentUser",
	initialState: {
		firstname: "",
		lastname: "",
		profilePictureURL: "fakebook-avatar.jpeg",
		backgroundPictureURL: "background-server.jpg",
		photos: [],
		posts: [],
		isOnline: false,
	},
	reducers: {
		currentUserUpdated: (state, action) => {
			const {
				firstname,
				lastname,
				profilePictureURL,
				backgroundPictureURL,
				photos,
				posts,
				isOnline,
				index,
			} = action.payload;
			state.firstname = firstname || state.firstname;
			state.lastname = lastname || state.lastname;
			state.profilePictureURL = profilePictureURL || state.profilePictureURL;
			state.backgroundPictureURL =
				backgroundPictureURL || state.backgroundPictureURL;
			if (isOnline || isOnline === 0 || isOnline === false)
				state.isOnline = isOnline;
			if (index >= 0) state.index = index;
			if (photos) {
				state.photos = [];
				if (!Array.isArray(photos)) state.photos = JSON.parse(photos);
				else photos.forEach((photo) => state.photos.push(photo));
			}
			if (posts) {
				state.posts = [];
				if (!Array.isArray(posts)) state.posts = JSON.parse(posts);
				else posts.forEach((post) => state.posts.push(post));
			}
		},
		currentUserLoggedOut: (state) => {
			state.isOnline = false;
			state.firstname = "";
			state.lastname = "";
			state.backgroundPictureURL = "background-server.jpg";
			state.profilePictureURL = "fakebook-avatar.jpeg";
			state.photos = [];
			state.posts = [];
		},
	},
});

export const { currentUserUpdated, currentUserLoggedOut } =
	currentUserSlice.actions;

export default currentUserSlice.reducer;
