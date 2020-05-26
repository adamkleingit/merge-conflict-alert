const core = require("@actions/core");
const github = require("@actions/github");
const exec = require("@actions/exec");

function execCommand(command, args = []) {
  const options = { cwd: process.env.GITHUB_WORKSPACE };
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

async function gitMergeConflictsCheck(branch) {
  const mergeBase = await execCommand('git', ['merge-base', 'HEAD', branch]);
  const mergeTree = await execCommand('git', ['merge-tree', mergeBase, 'HEAD', branch]);
  return mergeTree.match(/^\+=======$/);
}

async function run() {
  try {
    let errors = '';
    let branches = await execCommand("git", ["branch", "-aq"]);
    core.debug(JSON.stringify(github.context.payload, null, 2));
    branches = branches
      .split('\n')
      .map(branch => branch.replace(/\*/g, '').replace(/\s/g, ''))
      .filter(branch => branch.includes('remotes'));
      .filter(branch => branch !== `remotes/origin/${github.context.payload.default_branch}`)
    core.debug('brances');
    core.debug('-------');
    core.debug(branches);
    for(let branch in branches) {
      const isConflicted = await gitMergeConflictsCheck(branch);
      
      if (isConflicted) {
        errors += `branch has conflicts with ${branch}\n`;
        // TODO: report author of branch, code that conflicts
      }
    }
    if (errors) {
      core.setFailed(errors);
    }
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}
run();
