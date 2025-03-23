import { createSlice } from "@reduxjs/toolkit";

export const outgoingMessagesSlice = createSlice({
	name: "outgoingMessages",
	initialState: [],
	reducers: {
		outgoingMessagesUpdated: (state, action) => {
			action.payload.forEach((message) => {
				const msg = {
					messageID: message.message_id,
					isPhoto: Boolean(message.isPhoto),
					isRead: Boolean(message.isRead),
					photoURL: message.photoURL,
					sender: message.sender,
					recipient: message.recipient,
					text: message.text,
					timestamp: new Date(message.timestamp).toLocaleString(),
				};
				if (msg.timestamp === "Invalid Date")
					msg.timestamp = new Date().toLocaleString();
				state.push(msg);
			});
		},
	},
});

export const { outgoingMessagesUpdated } = outgoingMessagesSlice.actions;

export default outgoingMessagesSlice.reducer;
