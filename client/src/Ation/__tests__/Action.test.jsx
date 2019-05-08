/* globals describe test */
import { shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import * as React from 'react';
// eslint-disable-next-line no-unused-vars
import Action from '../Action.tsx';


// setup the adapter
configure({ adapter: new Adapter() });
// some basic tests
describe('Basic tests to StartMixing Component', () => {
    test('Should mount StartMixing with success', () => {
        // instantiate component
        shallow((<Action />));
    });
});
