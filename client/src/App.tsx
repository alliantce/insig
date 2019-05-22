import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Action from './Pages/Action/Action';
import AddState from './Pages/AddState/AddState';
import Auth from './Pages/Auth/Auth';
import Roles from './Pages/Roles/Roles';

class App extends Component {
    public render() {
        return (
            <div>
                <Router>
                    <div>
                        <Route path="/" exact={true} component={Action} />
                        <Route path="/action/" component={Action} />
                        <Route path="/auth/" component={Auth} />
                        <Route path="/addstate/" component={AddState} />
                        <Route path="/roles/" component={Roles} />
                    </div>
                </Router>
            </div>
        );
    }
}

export default App;
