const core = require("@actions/core");
const github = require("@actions/github");
const { exec } = require("child_process");

function execCommand(name, command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        core.setFailed(error);
        console.log(`${name} error: ${error.message}`);
        reject(error);

        return;
      }
      if (stderr) {
        core.setFailed(stderr);
        console.log(`${name} stderr: ${stderr}`);
        reject(stderr);

        return;
      }
      console.log(`${name}: ${stdout}`);
      resolve(stdout);
    });
  });
}

async function gitMergeCheck(branch) {
  const command = `git merge-tree $(git merge-base HEAD ${branch}) HEAD ${branch} | grep -q '^+=======$' && echo conflict || echo "no conflict"`;
  const result = await execCommand("listBranches", command);
}

async function listBranches() {
  const command = "git branch -aq";
  const result = await execCommand("listBranches", command);
}

try {
  // `who-to-greet` input defined in action metadata file
  listBranches();
  gitMergeCheck("conflicted_branch");
  gitMergeCheck("nonconflicted_branch");
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
