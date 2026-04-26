const chunks = [];
process.stdin.on('data', d => chunks.push(d));
process.stdin.on('end', () => {
  const issues = JSON.parse(chunks.join(''));
  issues.forEach(i => {
    if (!i.pull_request) {
      console.log('#' + i.number + ' | ' + i.user.login + ' | ' + i.title);
    }
  });
});
