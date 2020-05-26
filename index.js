const core = require("@actions/core");
const github = require("@actions/github");
const exec = require("@actions/exec");

function execCommand(command, args = []) {
  const options = { cwd: process.env.GITHUB_WORKSPACE };
  console.log('options', options);
  console.log('command', command);
  console.log('args', args);
  return new Promise((resolve, reject) => {
    options.listeners = {
      stdout: (data) => {
        const stdout = data.toString();
        resolve(stdout);
      },
      stderr: (data) => {
        const stderr = data.toString();
        reject(stderr);
      }
    };

    exec.exec(command, args, options)
      .catch(err => {
        reject(err);
      });
  });
}

async function gitMergeConflicts(branch) {
  const mergeBase = await execCommand('git', ['merge-base', 'HEAD', branch]);
  const mergeTree = await execCommand('git', ['merge-tree', mergeBase, 'HEAD', branch]);
  return mergeTree.match(/^\+=======$/);
}

async function run() {
  try {
    let branches = await execCommand("git", ["branch", "-aq"]);
    let errors = '';
    branches = branches.split('\n').map(branch => branch.replace(/\*/g, '').replace(/\s/g, ''))
    for(let branch in branches) {
      const isConflicted = await gitMergeCheck("origin/conflicted_branch");
      
      if (isConflicted) {
        errors += `branch has conflicts with ${branch}\n`;
        // TODO: report author of branch, code that conflicts
      }
    }
    if (errors) {
      core.setFailed(errors);
    }
  } catch (error) {
    console.log(error);
    core.setFailed(error.message);
  }
}
run();
