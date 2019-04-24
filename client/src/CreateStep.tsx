import React, { Component } from 'react';

import './main.scss';
import './createstep.scss';


enum DOMNames {
    action = 'action',
    description = 'description',
}
interface ICreateStep {
    action: string;
    description: string;
}
class CreateStep extends Component<{}, ICreateStep> {
    constructor(props: any) {
        super(props);
        this.state = {
            action: 'default',
            description: '',
        };
    }

    handleChange = (event: any) => {
        if (event.target.name === DOMNames.action) {
            this.setState({ action: event.target.value });
        } else if (event.target.name === DOMNames.description) {
            this.setState({ description: event.target.value });
        }
    }

    handleSubmit = (event: any) => {
        const { description } = this.state;
        alert('A name was submitted: ' + description);
        event.preventDefault();
    }

    render() {
        const { action, description } = this.state;
        return (
            <main>
                <form onSubmit={this.handleSubmit}>
                    <select name={DOMNames.action} value={action} onChange={this.handleChange}>
                        <option value="default" disabled>Option</option>
                    </select>
                    <input
                        className="description"
                        type="text"
                        name={DOMNames.description}
                        value={description}
                        onChange={this.handleChange}
                    />
                    <input type="submit" />
                </form>
            </main>
        );
    }
}

export default CreateStep;
