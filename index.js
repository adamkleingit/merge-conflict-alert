const core = require("@actions/core");
const github = require("@actions/github");
const exec = require("@actions/exec");
const { exec: childProcessExec } = require("child_process");

let pwd;
async function execCommand(command, args = []) {
  const options = pwd ? { cwd: `${pwd}/master` } : {};
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

    exec.exec(command, args, options);
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

async function gitMergeCheck(branch) {
  const mergeBase = await execCommand('git', ['merge-base', 'HEAD', branch]);
  return execCommand('git', ['merge-tree', mergeBase, 'HEAD', branch]);
  // lookup for ^+=======$
}

async function listBranches() {
  return execCommand("git", ["branch", "-q"]);
}

async function run() {
  try {
    // `who-to-greet` input defined in action metadata file
    pwd = await execCommand('pwd');
    console.log('pwd', pwd);
    const ls = await execCommand('ls', [`${pwd}/master`]);
    console.log('ls', ls);
    const branches = await listBranches();
    console.log('branches', branches);
//     const branches = await listBranches();
//     console.log("branches", branches);
    // await gitMergeCheck("conflicted_branch");
    // await gitMergeCheck("nonconflicted_branch");
    const 
    
    ToGreet = core.getInput("who-to-greet");
    console.log(`Hello ${nameToGreet}!`);
    const time = new Date().toTimeString();
    core.setOutput("time", time);
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2);
    console.log(`The event payload: ${payload}`);
  } catch (error) {
    console.error(error);
    core.setFailed(error.message);
  }
}
run();
