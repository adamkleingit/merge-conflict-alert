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
  const conflicts = [];
  let isConflict, startIndex, endIndex, curBlock;
  mergeTree.split('\n').forEach((row, index) => {
    if (row.includes('+<<<<<<<')) {
      startIndex = index;
      curBlock = '';
    }
    if (startIndex !== null) {
      curBlock += `\n${row}`;
    }
    if (row.includes('+>>>>>>>')) {
      if (isConflict) {
        conflicts.push([startIndex, index, curBlock]); 
      }
      startIndex = null;
      isConflict = false;
    }
    if (row === '+=======') {
      isConflict = true;
    }
  });
  return conflicts;
}

async function run() {
  try {
    let errors = '';
    const currentBranch = github.context.payload.ref.replace('refs/heads/', '');
    const defaultBranch = github.context.payload.repository.default_branch;
    if (false) {//currentBranch === defaultBranch) {
      core.debug(`Current branch is default branch - '${currentBranch}', skipping check`);
      return;
    }
    let branches = await execCommand("git", ["branch", "-aq"]);
    branches = branches
      .split('\n')
      .map(branch => branch.replace(/\*/g, '').replace(/\s/g, ''))
      .filter(branch => branch.includes('remotes'));
    core.debug('brances');
    core.debug('-------');
    core.debug(brances);
    for(let branch in branches) {
      core.debug(`checking branch ${branch}`);
      const conflicts = await gitMergeConflictsCheck(branch);
      
      if (conflicts) {
        core.debug(`branch ${branch} has conflicts `);
        errors += `branch has conflicts with ${branch}\n`;
        core.debug(conflicts);
        // TODO: report author of branch, code that conflicts
      } else {
        core.debug(`branch ${branch} has no conflicts`);
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
