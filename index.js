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
    // using @actions/exec:
//     options.listeners = {
//       stdout: (data) => {
//         const stdout = data.toString();
//         console.log('stdout');
//         resolve(stdout);
//       },
//       stderr: (data) => {
//         const stderr = data.toString();
//         console.log('stderr');
//         resolve(stderr);
//       }
//     };

//     exec.exec(command, args, options).then(r => console.log('resolved', r)).catch(err => resolve(err));
    // using child_process.exec:
    childProcessExec(`${command} ${args.join(' ')}`, options, (error, stdout, stderr) => {
      if (error) {
        console.log(`exec error: ${error}`);
//         core.setFailed(error);
        resolve(error);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      resolve(stdout);
    });
  });
}

async function gitMergeCheck(branch, pwd) {
  const mergeBase = await execCommand('git', ['merge-base', 'HEAD', branch]);
  return execCommand('git', ['merge-tree', mergeBase, 'HEAD', branch]);
  // lookup for ^+=======$
}


async function run() {
  try {
    pwd = process.env.GITHUB_WORKSPACE;
    console.log('pwd', pwd);
    const ls = await execCommand('ls', [process.env.GITHUB_WORKSPACE]);
    console.log('ls', ls);
    const branches = await execCommand("git", ["branch", "-q"], pwd);
    console.log('branches', branches);
    // await gitMergeCheck("conflicted_branch");
    // await gitMergeCheck("nonconflicted_branch");
    
    const payload = JSON.stringify(github.context.payload, undefined, 2);
    console.log(`The event payload: ${payload}`);
  } catch (error) {
    console.log(error);
    core.setFailed(error.message);
  }
}
run();
