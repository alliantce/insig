import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Action from './Action/Action';
import Auth from './Auth/Auth';
import CreateState from './CreateState/CreateState';

class App extends Component {
    public render() {
        return (
            <div>
                <Router>
                    <div>
                        <Route path="/" exact={true} component={Action} />
                        <Route path="/action/" component={Action} />
                        <Route path="/auth/" component={Auth} />
                        <Route path="/createstate/" component={CreateState} />
                    </div>
                </Router>
            </div>
        );
    }
}

export default App;
