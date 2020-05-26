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
      .then(exitCode => {
        resolve('');
      })
      .catch(err => {
        reject(err);
      });
  });
}

async function gitMergeConflictsCheck(branch) {
  let mergeBase = await execCommand('git', ['merge-base', 'HEAD', branch]);
  mergeBase = mergeBase.replace(/\n/g, '');
  const mergeTree = await execCommand('git', ['merge-tree', mergeBase, 'HEAD', branch]);

  const conflicts = [];
  let isConflict, startIndex, endIndex, block;
  mergeTree.split('\n').forEach((row, index) => {
    if (row.includes('+<<<<<<<')) {
      startIndex = index;
      block = '';
    }
    if (startIndex !== null) {
      block += `\n${row}`;
    }
    if (row.includes('+>>>>>>>')) {
      if (isConflict) {
        conflicts.push({startIndex, index, block}); 
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
    if (currentBranch === defaultBranch) {
      core.debug(`Current branch is default branch - '${currentBranch}', skipping check`);
      return;
    }
    let branches = await execCommand("git", ["branch", "-aq"]);
    core.debug('branches raw');
    core.debug('-------');
    core.debug(branches);
    branches = branches
      .split('\n')
      .map(branch => branch.replace(/\*/g, '').replace(/\s/g, ''))
      .filter(branch => branch.includes('remotes'));
    core.debug('branches');
    core.debug('-------');
    core.debug(branches);
    for(let branch of branches) {
      core.debug(`checking branch ${branch}`);
      const conflicts = await gitMergeConflictsCheck(branch);
      
      if (conflicts.length) {
        core.debug(`branch ${branch} has conflicts `);
        const blocks = conflicts.map(conflict => conflict.block).join('\n');
        errors += `branch has conflicts with ${branch}:\n${blocks}\n`;
        // TODO: report author of branch, code that conflicts
      } else {
        core.debug(`branch ${branch} has no conflicts`);
      }
    }
    if (errors) {
      core.warning(errors);
    } else {
      core.debug('Finished without errors');
    }
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}
run();
