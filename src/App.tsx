import { useState } from 'react'
import CSV_Swap from './tools/CSV_Swap'

function App() {
	const [count, setCount] = useState(0)

	return (
		<div className="App">
			<CSV_Swap />
		</div>
	)
}

export default App
