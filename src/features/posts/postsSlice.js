import { createSlice } from "@reduxjs/toolkit";

export const postsSlice = createSlice({
	name: "posts",
	initialState: [],
	reducers: {
		postsUpdated: (state, action) => {
			//const updatedState = [];
			action.payload.forEach((post) => {
				const isPostNew =
					state.filter((pst) => pst.postID === post.post_id).length === 0;
				if (isPostNew) {
					post.postID = post.post_id;
					delete post.post_id;
					post.userID = post.user_id;
					delete post.user_id;
					post.isPhoto = Boolean(post.isPhoto);
					post.isYoutube = Boolean(post.isYoutube);
					post.likes = JSON.parse(post.likes);
					post.comments = JSON.parse(post.comments);
					post.timestamp = new Date(post.timestamp).toLocaleString();
					if (post.timestamp === "Invalid Date")
						post.timestamp = new Date().toLocaleString();
					state.unshift(post);
				} else {
					const i = state.findIndex((pst) => pst.postID === post.post_id);
					if (post.likes) state[i].likes = JSON.parse(post.likes);
					if (post.comments) state[i].comments = JSON.parse(post.comments);
				}
			});
			//return updatedState;
		},
	},
});

export const { postsUpdated } = postsSlice.actions;

export default postsSlice.reducer;
