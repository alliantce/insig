import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Action from './Ation/Action';
import Auth from './Auth/Auth';
import CreateStep from './CreateStep/CreateStep';

class App extends Component {
    public render() {
        return (
            <div>
                <Router>
                    <div>
                        <Route path="/" exact={true} component={Action} />
                        <Route path="/action/" component={Action} />
                        <Route path="/auth/" component={Auth} />
                        <Route path="/createstep/" component={CreateStep} />
                    </div>
                </Router>
            </div>
        );
    }
}

export default App;
