import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Action from './Pages/Actions/Actions';
import Assets from './Pages/Assets/Assets';
import Auth from './Pages/Auth/Auth';
import Roles from './Pages/Roles/Roles';
import State from './Pages/States/States';

class App extends Component {
    public render() {
        return (
            <div>
                <Router>
                    <div>
                        <Route path="/" exact={true} component={Action} />
                        <Route path="/auth/" component={Auth} />
                        <Route path="/assets/" component={Assets} />
                        <Route path="/actions/" component={Action} />
                        <Route path="/states/" component={State} />
                        <Route path="/roles/" component={Roles} />
                    </div>
                </Router>
            </div>
        );
    }
}

export default App;
