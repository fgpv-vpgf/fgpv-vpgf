# Release Tutorial

Before you start this tutorial.  Please setup remotes `origin` and `upstream` that point to your forked repositories and original repositories respectively.

## geoApi Release

1. Change directory to your geoApi repository on your machine.

2. Checkout a new branch or choose an existing branch that mirrors the upstream develop branch (Let's call it local develop).

    ```
        git checkout [-b] develop
    ```

3. Change the version tag in `package.json` to the appropriate version.

    ```json
        "version": [version]
    ```
4. Commit and push the changes to your origin develop branch then do a pull request from origin develop against the upstream develop to get the upstream develop updated.

    <p class="tip">
        After the pull request is merged.  You local develop should be again synchronized with upstream develop.
    </p>

    <p class="danger">
        Please ensure upstream master and upstream develop are mergeable (i.e. develop is not behind master) before you continue with the next step.
    </p>

5. Ensure your local master branch is up to date with the upstream master branch.

6. Checkout the local master branch , then do a rebase with the local develop branch.

    ```
        git checkout master && git rebase develop
    ```

7. Push the rebased local master branch to the upstream master.

    ```
        git push upstream master
    ```

8. Stay in the local master branch and create a version tag then push the tag to upstream.

    ```
        git tag [version] && git push upstream [version]
    ```

## FGPV Release

1. Change directory to your FGPV repository on your machine.

2. Checkout a new branch or choose an existing branch that mirrors the upstream develop branch (Let's call it local develop).

    ```
        git checkout [-b] develop
    ```

3. Change the version tag and geoApi tag in `package.json` to the appropriate versions

    ```json
        "version": [version],
        "geoApi": "github:fgpv-vpgf/geoApi#[version]",
    ```
    <p class="tip">
        Please ensure GeoApi has been released first.  Ideally the version of geoApi should match the version of the viewer
    </p>

4. Do `npm install` to update the local geoApi module, then do a sanity check on the viewer.

5. Update JSDocs link under Technical JSDocs in `docs/index.html`.
    ```js
        {title: 'Technical JSDocs', path: [JSDocs Link]}
    ```
6. Commit and push the changes to your origin develop branch then do a pull request from origin develop against the upstream develop to get the upstream develop updated.

    <p class="tip">
        After the pull request is merged.  You local develop should be again synchronized with upstream develop.
    </p>

    <p class="danger">
        Please ensure upstream master and upstream develop are mergeable (i.e. develop is not behind master) before you continue with the next step.
    </p>

7. Ensure your local master branch is up to date with the upstream master branch.

8. Checkout the local master branch , then do a rebase with the local develop branch.

    ```
        git checkout master && git rebase develop
    ```

9. Push the rebased local master branch to the upstream master.

    ```
        git push upstream master
    ```

10. Stay in the local master branch and create a version tag then push the tag to upstream.

    ```
        git tag [version] && git push upstream [version]
    ```
11. Create a build and compress all build files to zip format.  The build can be found in `./build` and please leave out any samples when compressing.  You can also find the zipped build on http://fgpv.cloudapp.net/demo/[version]/dist/ if you have access to the fpgv cloud drive.

12. Drag the zipped build in the release note.

13. Ensure the release note is complete and correct.  Choose the correct tag on the release note then publish the release if you are satisfied.

14. Finally.  Update the documentation link in the repository description.
