
const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  const context = github.context;

  const issueMessage = `Welcome to Accord. Thanks a lot for reporting your first issue. Please check out our [contributors guide](https://github.com/accordproject/techdocs/blob/main/CONTRIBUTING.md).<br />Keep in mind there are also other channels you can use to interact with the Accord community. For more details check out our [Discord](https://discord.com/invite/Zm99SKhhtA).`;

  const prMessage = `Welcome to Accord. Thanks a lot for creating your first pull request. Please check out our [contributors guide](https://github.com/accordproject/techdocs/blob/main/CONTRIBUTING.md).<br />Keep in mind there are also other channels you can use to interact with the Accord community. For more details check out our [Discord](https://discord.com/invite/Zm99SKhhtA).`;
   let token=process.env.GITHUB_TOKEN;
  const octokit = github.getOctokit(token);
  const isIssue = !!context.payload.issue;
  let isFirstContribution;

  if (isIssue) {
    const query = `query($owner:String!, $name:String!, $contributer:String!) {
      repository(owner:$owner, name:$name){
        issues(first: 1, filterBy: {createdBy:$contributer}){
          totalCount
        }
      }
    }`;
    const variables = {
      owner: context.repo.owner,
      name: context.repo.repo,
      contributer: context.payload.sender.login
    };
    const { repository: { issues: { totalCount } } } = await octokit.graphql(query, variables);
    isFirstContribution = totalCount === 1;
  } else {
    const query = `query($qstr: String!) {
      search(query: $qstr, type: ISSUE, first: 1) {
         issueCount
       }
    }`;
    const variables = {
      qstr: `repo:${context.repo.owner}/${context.repo.repo} type:pr author:${context.payload.sender.login}`,
    };
    const { search: { issueCount } } = await octokit.graphql(query, variables);
    isFirstContribution = issueCount === 1;
  }

  if (!isFirstContribution) {
    console.log(`Not the user's first contribution.`);
    return;
  }

  const message = isIssue ? issueMessage : prMessage;

  if (isIssue) {
    const issueNumber = context.payload.issue.number;
    await octokit.rest.issues.createComment({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      issue_number: issueNumber,
      body: message
    });
  } else {
    const pullNumber = context.payload.pull_request.number;
    await octokit.rest.pulls.createReview({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      pull_number: pullNumber,
      body: message,
      event: 'COMMENT'
    });
  }
}

run().catch(err => core.setFailed(err.message));
