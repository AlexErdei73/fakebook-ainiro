import { render } from 'preact'
import './index.css'
import App from './app.jsx'
import store from './app/store'
import { Provider } from 'react-redux'

render(
	<Provider store={store}>
		<App />
	</Provider>,
	document.getElementById("app")
);
