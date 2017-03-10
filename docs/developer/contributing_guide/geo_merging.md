This guide will help you transition changes made in geoApi for inclusion in this project. We assume the changes we want to incorporate are located on the develop branch of geoApi and have already been tested.

#### Create a merging branch

Open a terminal in your local geoApi folder and execute the following commands. They will create a local and origin branch which we'll use to open a new PR.

```shell
git fetch upstream
git checkout master
git reset --hard upstream/master
git merge --ff-only upstream/develop
git checkout -b master-vx.y.z
git push --set-upstream origin master-vx.y.z
```

#### Open a PR & merge

The master branch is protected, so we can't push our branch directly. Instead, open a PR on geoApi which targets master. Once all checks have passed the branch can be merged,.

#### Tagging

Lets tag the master branch:

```shell
git checkout master
git pull --ff-only upstream master
git tag vx.y.z
git push upstream vx.y.z
```

#### Release & Distribution


Running `gulp dist` will create all the files needed for this release in your local `dist` folder. We can now create a new release with the tag we just created. Upload all the files in your `dist` folder to the release. Write any comments you want to include then publish.

Make a note of the official release file location, such as `https://github.com/fgpv-vpgf/geoApi/releases/download/vx.y.z/geoapi-x.y.z.tgz`

#### Final steps

You'll need to open a pull request which includes the updated geoApi file location located in `bower.json`. Once tested and all checks are passed it will be merged.

#### Notes
- A release tag is typically of the form vx.y.z where x is major, y is minor, and z is the patch version.
- Non release tags also include a dash followed by either a number or 'RC' such as v1.2.3-RC1 or v1.2.3-0.
- All release tags should only reference commits made to master. Non release tags can point to a commit on any branch.
- Releases with a release tag must have the proper distribution files added. Running the command `gulp dist` will place the files needed in your local `dist` folder.