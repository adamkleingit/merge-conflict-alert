const core = require("@actions/core");
const github = require("@actions/github");
const exec = require("@actions/exec");
const { exec: childProcessExec } = require("child_process");

async function execCommand(name, command, args) {
  const options = { cwd: "./master" };
  return exec.exec(command, args, options);
  return new Promise((resolve, reject) => {
    childProcessExec(`command ${args.join(' ')}`, options, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        core.setFailed(error);
        reject(error);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
      resolve(stdout);
    });
  });
}

async function gitMergeCheck(branch) {
  const command = `git merge-tree $(git merge-base HEAD ${branch}) HEAD ${branch} | grep -q '^+=======$' && echo conflict || echo "no conflict"`;
  return execCommand("listBranches", command, []);
}

async function listBranches() {
  return execCommand("listBranches", "git", ["branch", "-q"]);
}

async function run() {
  try {
    // `who-to-greet` input defined in action metadata file
    const branches = await listBranches();
    console.log("branches", branches);
    // await gitMergeCheck("conflicted_branch");
    // await gitMergeCheck("nonconflicted_branch");
    const nameToGreet = core.getInput("who-to-greet");
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
