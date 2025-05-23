import { createSlice } from "@reduxjs/toolkit";

export const incomingMessagesSlice = createSlice({
	name: "incomingMessages",
	initialState: [],
	reducers: {
		incomingMessagesUpdated: (state, action) => {
			action.payload.forEach((message) => {
				const i = state.map((msg) => msg.messageID).indexOf(message.message_id);
				const isMessageNew = i === -1;
				if (isMessageNew) {
					const msg = {
						messageID: message.message_id,
						isPhoto: Boolean(message.isPhoto),
						isRead: Boolean(message.isRead),
						photoURL: message.photoURL,
						sender: message.sender,
						recipient: message.recipient,
						text: message.text,
						timestamp: new Date().toISOString(),
					};
					if (message.timestamp)
						msg.timestamp = new Date(message.timestamp).toISOString();
					state.push(msg);
				} else {
					state[i].isRead = message.isRead;
				}
			});
		},
		incomingMessagesDeleted: (state) => [],
	},
});

export const { incomingMessagesUpdated, incomingMessagesDeleted } =
	incomingMessagesSlice.actions;

export default incomingMessagesSlice.reducer;
