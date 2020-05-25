const core = require("@actions/core");
const github = require("@actions/github");
// const exec = require("@actions/exec");
const { exec } = require("child_process");

async function execCommand(name, command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
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
  return execCommand("listBranches", command);
}

async function listBranches() {
  const command = "git branch -aq";
  return execCommand("listBranches", command);
}

async function run() {
  try {
    // `who-to-greet` input defined in action metadata file
    const ls = await execCommand("ls -aR");
    console.log("ls", ls);
    // await listBranches();
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
