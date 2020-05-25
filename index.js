const core = require("@actions/core");
const github = require("@actions/github");
const { exec } = require("@actions/exec");

async function execCommand(name, command) {
  try {
    const options = {};
    options.listeners = {
      stdout: (data) => {
        const stdout = data.toString();
        console.log(`${name}: ${stdout}`);
      },
      stderr: (data) => {
        const stderr = data.toString();
        // core.setFailed(stderr);
        console.error(`${name} stderr: ${stderr}`);
      },
    };
    return exec(command);
  } catch (error) {
    // core.setFailed(error);
    console.error(`${name} error: ${error.message}`);
  }
}

async function gitMergeCheck(branch) {
  const command = `git merge-tree $(git merge-base HEAD ${branch}) HEAD ${branch} | grep -q '^+=======$' && echo conflict || echo "no conflict"`;
  return execCommand("listBranches", command);
}

async function listBranches() {
  const command = "git branch -aq";
  return execCommand("listBranches", command);
}

async function run() {
  try {
    // `who-to-greet` input defined in action metadata file
    await listBranches();
    await execCommand("ls -aR");
    await gitMergeCheck("conflicted_branch");
    await gitMergeCheck("nonconflicted_branch");
    const nameToGreet = core.getInput("who-to-greet");
    console.log(`Hello ${nameToGreet}!`);
    const time = new Date().toTimeString();
    core.setOutput("time", time);
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2);
    console.log(`The event payload: ${payload}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}
run();
