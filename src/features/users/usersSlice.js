import { createSlice } from "@reduxjs/toolkit";

export const usersSlice = createSlice({
	name: "users",
	initialState: [],
	reducers: {
		usersUpdated: (state, action) => {
			action.payload.forEach((user) => {
				const isUserNew =
					state.filter((usr) => usr.userID === user.user_id).length === 0;
				if (isUserNew) {
					user.userID = user.user_id;
					delete user.user_id;
					user.isOnline = Boolean(user.isOnline);
					user.isEmailVerified = Boolean(user.isEmailVerified);
					user.posts = JSON.parse(user.posts);
					user.photos = JSON.parse(user.photos);
					delete user.password_hash;
					state.push(user);
				} else {
					const i = state.findIndex((usr) => usr.userID === user.user_id);
					if (user.isOnline !== undefined)
						state[i].isOnline = Boolean(user.isOnline);
					if (user.isEmailVerified)
						state[i].isEmailVerified = Boolean(user.isEmailVerified);
					if (user.posts) state[i].posts = JSON.parse(user.posts);
					if (user.photos) state[i].photos = JSON.parse(user.photos);
					if (user.profilePictureURL)
						state[i].profilePictureURL = user.profilePictureURL;
					if (user.backgroundPictureURL)
						state[i].backgroundPictureURL = user.backgroundPictureURL;
					delete state[i].password_hash;
					delete state[i].user_id;
					state[i].userID = user.user_id;
				}
			});
		},
		usersDeleted: () => {
			return [];
		},
	},
});

export const { usersUpdated, usersDeleted } = usersSlice.actions;

export default usersSlice.reducer;
