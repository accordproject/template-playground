import * as playground from './playground';
import * as helloworld from './helloworld';
import * as formulanow from './formulanow';
import * as join from './join';
import * as clause from './clause';
import * as list from './list';
import * as optional from './optional';
import * as markdown from './markdown';

export type Sample = {
    NAME: string,
    MODEL: string,
    TEMPLATE: string,
    DATA: object
}

export const SAMPLES:Array<Sample> = [
    playground,
    helloworld,
    formulanow,
    join,
    clause,
    list,
    optional,
    markdown
];