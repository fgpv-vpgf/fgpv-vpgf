## pip install PyGithub

import re, sys, subprocess, json, collections, time, os, sys
from github import Github

class WeeklyBuilder:
    """Releases, tags, and generates documentation for the weekly build
    """
    def __init__(self, token):
        """Initalize the class

        Args:
            token: Github developer token for API 3 access
        """
        self.github = Github(token)
        self.org_repo = self.github.get_organization("fgpv-vpgf").get_repo("fgpv-vpgf")
        self.user = self.github.get_user()
        self.maxMergeTries = 0

    def listBuildBranches(self):
        """Return a list of upstream release branches to be updated in this weekly build.

        Returns:
            A list of string branch names
        """
        pattern = re.compile("^upstream/(develop|v)")
        list_remote_branches = subprocess.run(['git', 'branch', '-r'], shell=True, stdout=subprocess.PIPE, universal_newlines=True)
        only_upstream_branches = [str.strip(line) for line in list_remote_branches.stdout.splitlines()]
        return [up_branch for up_branch in only_upstream_branches if pattern.match(up_branch)]

    def readJsonFile(self, filename):
        """Opens the provided filename and returns a dict of the json file contents

        Args:
            filename: the file name to read

        Returns:
            A dict of json file
        """

        with open(filename, 'r') as openfile:
            return json.load(openfile, object_pairs_hook=collections.OrderedDict)

    def writeJsonFile(self, filename, data):
        """Replaces the json in filename with data

        Args:
            filename: the file name to write
            data: dict to replace data in file
        """
        with open(filename, 'w+') as openfile:
            openfile.write(json.dumps(data, indent=2))

    def checkoutBranch(self, branch):
        """Given a valid upstream branch, determines and checksout next weekly build branch

        Args:
            branch: upstream branch name to base weekly build on
        """
        subprocess.run(['git', 'checkout', branch], stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)

        version = self.readJsonFile('package.json')['version'].split('-')
        build_num = 1
        if len(version) > 1:
            build_num = int(version[1]) + 1

        self.next_version = str(version[0]) + '-' + str(build_num)
        self.next_branch = 'build/weekly-' + self.next_version

        try:
            subprocess.run(['git', 'checkout', '-b', self.next_branch], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
        except:
            subprocess.run(['git', 'checkout', self.next_branch], stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)

    def updateJsonFiles(self, filename):
        """Saves the weekly build version to the given filename

        Args:
            filename: name of the json file to update version
        """
        json = self.readJsonFile(filename)
        json['version'] = self.next_version
        self.writeJsonFile(filename, json)

    def mergePull(self, pull):
        """Attempts to merge the pull request, if unsuccessful waits 6 minutes and tries again

        Args:
            pull: The pull request object to be merged
        """
        try:
            pull.merge()
            self.maxMergeTries = 0
        except:
            if not pull.merged() and self.maxMergeTries < 3:
                pull.create_issue_comment('Trying to merge - waiting for checks to pass')
                self.maxMergeTries += 1
                time.sleep(360)
                self.mergePull(pull)

    def run(self):
        """Starts the release process for all valid upstream branches
        """
        for branch in self.listBuildBranches():
            self.checkoutBranch(branch)
            self.updateJsonFiles('package.json')
            self.updateJsonFiles('bower.json')

            subprocess.run(['git', 'commit', '-am', '\'chore(build): weekly build\''])
            subprocess.run(['git', 'push', '--set-upstream', 'origin', self.next_branch], stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)

            base = branch.replace('upstream/', '')
            head = self.user.login + ':' + self.next_branch
            print("Automated pull request for weekly release " + self.next_version)

            #pull = self.org_repo.create_pull("Automated pull request for weekly release " + self.next_version, "", base, head)
            #self.mergePull(pull)

            #subprocess.run(['git', 'tag', 'weekly-' + self.next_version], stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
            #subprocess.run(['git', 'push', 'upstream', 'weekly-' + self.next_version], stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)

            title = 'Weekly RAMP2 Build - FGP Viewer v' + self.next_version
            body = """### Weekly Build Release %s
- [Production Builds](http://fgpv.cloudapp.net/demo/users/%s/build/%s/prod/samples/)
- [Developer Builds](http://fgpv.cloudapp.net/demo/users/%s/build/%s/dev/samples/)""" % self.next_version, self.user.login, 'weekly-' + self.next_version, self.user.login, 'weekly-' + self.next_version

            #self.org_repo.create_git_release('weekly-' + self.next_version, title, body, draft=False, prerelease=True)

if __name__ == '__main__':
    if len(sys.argv) == 2:
        build = WeeklyBuilder(sys.argv[1])
    else:
        build = WeeklyBuilder(os.environ['GITHUB_TOKEN'])

    build.run()
