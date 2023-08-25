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
    --github,   -g  Open Github page
    --yarn,     -y  Open yarn page
    --specific, -s  Open a specific github page

  Examples
    $ npm-pack express
    $ npm-pack express -g
    $ npm-pack nodejs/node -s
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
      specific: {
        type: "boolean",
        shortFlag: "s",
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

if (cli.input.length > 0) {
  if (cli.flags.specific) {
    await pMap(
      cli.input.map((i) => i.split("/")),
      ([author, name]) => {
        return open(`https://github.com/${author}/${name}`);
      },
      { concurrency: 5 }
    );
  } else {
    await pMap(
      cli.input,
      (name) => {
        return openPage(name);
      },
      { concurrency: 5 }
    );
  }
} else {
  const packageData = await readPackageUp();
  openPage(packageData.packageJson.name);
}
