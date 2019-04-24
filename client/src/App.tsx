import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';

import Action from "./Action";
import CreateStep from "./CreateStep";

class App extends Component {
    render() {
        return (
            <div>
                <Router>
                    <div>
                        <Route path="/" exact component={Action} />
                        <Route path="/action/" component={Action} />
                        <Route path="/createstep/" component={CreateStep} />
                    </div>
                </Router>
            </div>
        );
    }
}

export default App;
