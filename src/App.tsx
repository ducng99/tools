import { Outlet, useNavigation } from 'react-router-dom';
import Sidebar from './common/Sidebar';
import Loading from './Loading';

function App() {
    const navigation = useNavigation();

    return (
        <div className="container-fluid">
            <div className="row flex-column flex-md-row min-vh-100">
                <Sidebar />
                <div className="col">
                    {
                        navigation.state === 'loading'
                            ? <Loading />
                            : <Outlet />
                    }
                </div>
            </div>
        </div>
    );
}

export default App;
