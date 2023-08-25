import { readPackageUp } from "read-pkg-up";
import packageJson from "package-json";
import isUrl from "is-url-superb";
import githubUrlFromGit from "github-url-from-git";
import meow from "meow";
import open from "open";
import pMap from "p-map";

const cli = meow(
  `
  Usage
    $ npm-pack [package-name] 
  
  Options 
    --github, -g  Go to Github page
    --yarn,   -y  Open yarn page

  Examples
    $ npm-pack express
    $ npm-pack express -g
`,
  {
    importMeta: import.meta,
    flags: {
      github: {
        type: "boolean",
        shortFlag: "g",
      },
      yarn: {
        type: "boolean",
        shortFlag: "y",
      },
    },
  }
);

function openNpmPage(name) {
  return open(`https://npmjs.com/package/${name}`);
}

function openYarnPage(name) {
  return open(`https://yarnpkg.com/package?name=${name}`);
}

const openPackagePage = cli.flags.yarn ? openYarnPage : openNpmPage;

async function openGithubPage(name) {
  try {
    const { repository } = await packageJson(name, { fullMetadata: true });
    if (!repository?.url) {
      return openPackagePage(name);
    }

    let url = githubUrlFromGit(repository.url);

    if (!url) {
      url = repository.url;

      if (isUrl(url) && /^(https:\/\/)/.test(url)) {
        console.error(`
          URL specified in the repository at ${name} does not point to a git page.
        `);
      } else {
        console.error(`
          URL specified in the repository at ${name} is invalid.
        `);
      }
    }

    open(url);
  } catch (err) {
    throw err;
  }
}

const openPage = cli.flags.github ? openGithubPage : openPackagePage;

console.log(cli);

if (cli.input.length > 0) {
  await pMap(
    cli.input,
    (name) => {
      return openPage(name);
    },
    { concurrency: 5 }
  );
} else {
  const packageData = await readPackageUp();
  console.log(packageData);
  openPage(packageData.packageJson.name);
}
