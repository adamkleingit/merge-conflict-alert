const core = require("@actions/core");
const github = require("@actions/github");
const exec = require("@actions/exec");
const { exec: childProcessExec } = require("child_process");

function execCommand(command, args = []) {
  const options = { cwd: process.env.GITHUB_WORKSPACE };
  console.log('options', options);
  console.log('command', command);
  console.log('args', args);
  return new Promise((resolve, reject) => {
    // using @actions/exec:
    options.listeners = {
      stdout: (data) => {
        const stdout = data.toString();
        console.log('stdout');
        resolve(stdout);
      },
      stderr: (data) => {
        const stderr = data.toString();
        console.log('stderr');
        core.setFailed(stderr);
        reject(stderr);
      }
    };

    exec.exec(command, args, options)
      .then(r => console.log('resolved', r))
      .catch(err => {
        core.setFailed(err);
        reject(err);
      });
    // using child_process.exec:
//     childProcessExec(`${command} ${args.join(' ')}`, options, (error, stdout, stderr) => {
//       if (error) {
//         console.log(`exec error: ${error}`);
// //         core.setFailed(error);
//         resolve(error);
//         return;
//       }
//       console.log(`stdout: ${stdout}`);
//       console.log(`stderr: ${stderr}`);
//       resolve(stdout);
//     });
  });
}

async function gitMergeCheck(branch) {
  const mergeBase = await execCommand('git', ['merge-base', 'HEAD', branch]);
  return execCommand('git', ['merge-tree', mergeBase, 'HEAD', branch]);
  // lookup for ^+=======$
}


async function run() {
  try {
    const ls = await execCommand('ls');
    console.log('ls', ls);
    const branches = await execCommand("git", ["branch", "-aq"]);
    console.log('branches', branches);
    const conflicted_branch = await gitMergeCheck("origin/conflicted_branch");
    console.log(conflicted_branch);
    const nonconflicted_branch = await gitMergeCheck("origin/nonconflicted_branch");
    console.log(nonconflicted_branch);
    
    const payload = JSON.stringify(github.context.payload, undefined, 2);
  } catch (error) {
    console.log(error);
    core.setFailed(error.message);
  }
}
run();
