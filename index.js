const core = require("@actions/core");
const github = require("@actions/github");
const exec = require("@actions/exec");
const { exec: childProcessExec } = require("child_process");

let pwd;
function execCommand(command, args = [], cwd) {
  const options = cwd ? { cwd } : {};
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
        resolve(stderr);
      }
    };

    exec.exec(command, args, options).catch(err => resolve(err));
//     childProcessExec(`${command} ${args.join(' ')}`, options, (error, stdout, stderr) => {
//       if (error) {
//         console.error(`exec error: ${error}`);
// //         core.setFailed(error);
//         resolve(error);
//         return;
//       }
//       console.log(`stdout: ${stdout}`);
//       console.error(`stderr: ${stderr}`);
//       resolve(stdout);
//     });
  });
}

async function gitMergeCheck(branch, pwd) {
  const mergeBase = await execCommand('git', ['merge-base', 'HEAD', branch]);
  return execCommand('git', ['merge-tree', mergeBase, 'HEAD', branch]);
  // lookup for ^+=======$
}


async function run() {
  try {
    // `who-to-greet` input defined in action metadata file
    pwd = await execCommand('pwd');
    pwd = pwd.replace('\n', '');
    pwd = `${pwd}/master`;
    console.log('pwd', pwd);
    const ls = await execCommand('ls', ['-R'], '/home/runner/');
    console.log('ls', ls);
    const branches = await execCommand("git", ["branch", "-q"], pwd);
    console.log('branches', branches);
    // await gitMergeCheck("conflicted_branch");
    // await gitMergeCheck("nonconflicted_branch");
    
    const payload = JSON.stringify(github.context.payload, undefined, 2);
    console.log(`The event payload: ${payload}`);
  } catch (error) {
    console.error(error);
    core.setFailed(error.message);
  }
}
run();
