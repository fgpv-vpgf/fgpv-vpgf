# Release Tutorial

(Note: this is not part of the published doc pages (i.e. no menu leads to it). But it is very useful to core team developers, so adding back after it was removed)

Before you start this tutorial.  Please setup remotes `origin` and `upstream` that point to your forked repositories and original repositories respectively.

## Plugins Release

Note: with the monorepo, this section is no longer relevant.

1. Change directory to your plugins repository on your machine.

2. Checkout the existing branch that mirrors the upstream develop branch (Let's call it local develop).

    ```
        git checkout develop
    ```

3. Ensure the branch is up to date with the upstream branch

    ```
        git pull --ff--only upstream develop
    ```

4. Execute the command to publish a new version to NPM. Select the version type that is appropriate for the release. See [npm version docs](https://docs.npmjs.com/cli/version)

    ```
        npm version [ major | minor | patch | prerelease ]
        or
        npm version [version]
    ```

5. The local branch will auto update with a new tag and changes to `package.json`. However the commit will not end up on any of the remote branches. It should be merged into the develop or master branch depending on the release.

## geoApi Release

Note: with the monorepo, this section is no longer relevant.

1. Change directory to your geoApi repository on your machine.

2. Checkout a new branch or choose an existing branch that mirrors the upstream develop branch (Let's call it local develop).

    ```
        git checkout [-b] develop
    ```

3. Change the version tag in `package.json` and `package-lock.json` to the appropriate version.

    ```json
        "version": [version]
    ```

4. Commit and push the changes to your origin develop branch then do a pull request from origin develop against the upstream develop to get the upstream develop updated.

    <p class="tip">
        After the pull request is merged, ensure your local develop is re-synchronized with upstream develop.
    </p>

    <p class="danger">
        Please ensure upstream master and upstream develop are mergeable (i.e. develop is not behind master) before you continue with the next step.
    </p>

5. Ensure your local master branch is up to date with the upstream master branch.

6. Checkout the local master branch , then do a rebase with the local develop branch.

    ```
        git checkout master
        git rebase develop
    ```

7. Push the rebased local master branch to the upstream master.

    ```
        git push upstream master
    ```

8. Stay in the local master branch and create a version tag then push the tag to upstream.

    ```
        git tag [version]
        git push upstream [version]
    ```

## FGPV Release

1. Change directory to your FGPV repository on your machine.

2. Checkout a new branch or choose an existing branch that mirrors the upstream develop branch (Let's call it local develop).

    ```
        git checkout [-b] develop
    ```

3. Change the version tag and geoApi tag in `package.json` and `package-lock.json` to the appropriate versions. Note geoapi and plugins versions are no longer relevant.

    ```json
        "version": [version],
        "geoApi": "github:fgpv-vpgf/geoApi#[version]",
        "@fgpv/rv-plugins": "[version]",
    ```
    <p class="tip">
        Please ensure GeoApi and Plugins has been released first.  Ideally the versions of both should match the version of the viewer
    </p>

4. Update the documentation urls in `README.md` to point to the current version of the documents. Note the actual URLs will not exist until the new tag is generated (a later step).  The url change will generally only involve updating the version number in the path. Also update the path to the samples folder url.

5. Do `npm install` to update the local geoApi and plugins module, then do a sanity check on the viewer.

    <p class="tip">
        Sometimes `npm install` will not get the correct integrity key for the plugins module. The following steps can manually resolve this.

        - Visit https://registry.npmjs.org/@fgpv/rv-plugins/
        - Do a search (`CTRL+F`) for the version number of the plugins module you are updating to.
        - Under the version json object, look for property `dist`, and inside that is property `integrity`. Copy the value of the integrity.
        - In the `package-lock.json` file of the viewer, search for `rv-plugins` and update the `integrity` value there with the copied value.
    </p>

6. Commit and push the changes to your origin develop branch then do a pull request from origin develop against the upstream develop to get the upstream develop updated.

    <p class="tip">
        After the pull request is merged, ensure your local develop is re-synchronized with upstream develop.
    </p>

    <p class="danger">
        Please ensure upstream master and upstream develop are mergeable (i.e. develop is not behind master) before you continue with the next step.
    </p>

7. Ensure your local master branch is up to date with the upstream master branch.

8. Checkout the local master branch , then do a rebase with the local develop branch.

    ```
        git checkout master
        git rebase develop
    ```

9. Push the rebased local master branch to the upstream master.

    ```
        git push upstream master
    ```

10. Stay in the local master branch and create a version tag then push the tag to upstream.

    ```
        git tag [version]
        git push upstream [version]
    ```

11. Create a build and compress all build files to zip format.  The build can be found in `./build` and please leave out any samples when compressing.  You can also find the zipped build on http://fgpv.cloudapp.net/demo/[version]/dist/ if you have access to the fpgv cloud drive.

12. Drag the zipped build in the release note.

13. Ensure the release note is complete and correct.  Choose the correct tag on the release note then publish the release if you are satisfied.

