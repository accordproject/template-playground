/**
 * counterLogic.ts — "Counter Contract" sample with TypeScript logic
 *
 * Demonstrates the full stateful logic lifecycle:
 *   init()    → establishes initial state (count = 0)
 *   trigger() → increments the counter, enforces a max limit
 *
 * Based on the demo-template pattern from accordproject/demo-template.
 */

export const NAME = 'Counter Contract (with Logic)';

export const MODEL = `namespace org.acme.counter@1.0.0

@template
concept CounterContract {
  o String owner
  o Integer maxCount
}

transaction CounterRequest {
  o Integer increment
}

transaction CounterResponse {
  o String message
  o Integer newCount
}

event CounterUpdated {
  o Integer previousCount
  o Integer nextCount
}

asset CounterState identified by stateId {
  o String stateId
  o Integer count
  o String owner
}`;

export const TEMPLATE = `# Counter Contract

Owner: **{{owner}}**
Maximum allowed count: **{{maxCount}}**

This contract tracks a counter for {{owner}}.
Each request increments the counter by a specified amount.
The counter cannot exceed {{maxCount}}.`;

export const DATA = {
  $class: 'org.acme.counter@1.0.0.CounterContract',
  owner: 'Alice',
  maxCount: 10,
};


export const LOGIC = `// Counter Contract Logic
// Demonstrates: init() for state setup + trigger() with state accumulation

class CounterLogic extends TemplateLogic<any> {

  // Called once to initialize the contract state
  async init(data: any) {
    return {
      state: {
        $class: 'org.acme.counter@1.0.0.CounterState',
        stateId: 'counter-state',
        $identifier: 'counter-state',
        count: 0,
        owner: data.owner,
      },
      events: [],
    };
  }

  // Called for each request — increments the counter
  async trigger(data: any, request: any, state: any) {
    const currentCount = (state?.count ?? 0) as number;
    const increment = (request?.increment ?? 1) as number;
    const newCount = currentCount + increment;

    // Enforce the maximum count from the contract data
    if (newCount > data.maxCount) {
      throw new Error(
        \`Count \${newCount} exceeds the maximum of \${data.maxCount} for \${data.owner}\`
      );
    }

    return {
      result: {
        $class: 'org.acme.counter@1.0.0.CounterResponse',
        $timestamp: new Date().toISOString(),
        message: \`\${data.owner}'s count is now \${newCount} (of \${data.maxCount})\`,
        newCount,
      },
      state: {
        $class: 'org.acme.counter@1.0.0.CounterState',
        ...state,
        count: newCount,
      },
      events: [
        {
          $class: 'org.acme.counter@1.0.0.CounterUpdated',
          $timestamp: new Date().toISOString(),
          previousCount: currentCount,
          nextCount: newCount,
        },
      ],
    };
  }
}

export default CounterLogic;`;

// Default request JSON pre-filled in the ContractRunner request editor
export const DEFAULT_REQUEST = JSON.stringify(
  {
    $class: 'org.acme.counter@1.0.0.CounterRequest',
    $timestamp: new Date().toISOString(),
    increment: 1,
  },
  null,
  2
);
