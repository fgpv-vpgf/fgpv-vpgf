## pip install PyGithub
import re, sys, subprocess, json, collections, time, tempfile, os, sys, git
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
        self.repoAPI = self.github.get_organization("fgpv-vpgf").get_repo("fgpv-vpgf")
        self.user = self.github.get_user()

        # checkout repo to temp directory and build it
        with tempfile.TemporaryDirectory() as tmpdirname:
            os.chdir(tmpdirname)
            self.repo = git.Repo.clone_from(self.repoAPI.clone_url, tmpdirname)
            self.git = self.repo.git
            os.popen('npm install')

    def listBuildBranches(self):
        """Return a list of upstream release branches to be updated in this weekly build.

        Returns:
            A list of string branch names
        """
        pattern = re.compile("^upstream/(develop|v)")
        list_remote_branches = self.git.branch('-r')
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

        Returns:
            True if branch can be checked out and a new weekly build is possible, false otherwise
        """
        self.git.checkout(branch)

        version = self.readJsonFile('package.json')['version'].split('-')

        # fails on a full release since version[1] is undefined, return False so a weekly build is not created
        try:
            self.next_version = str(version[0]) + '-' + str(int(version[1]) + 1)
        except:
            return False

        self.next_branch = 'build/weekly-' + self.next_version

        try:
            self.git.checkout(self.next_branch)
        except:
            self.git.checkout(branch, b=self.next_branch)

        return True

    def updateJsonFiles(self, filename):
        """Saves the weekly build version to the given filename

        Args:
            filename: name of the json file to update version
        """
        json = self.readJsonFile(filename)
        json['version'] = self.next_version
        self.writeJsonFile(filename, json)

    def mergePull(self, pull, mergeTries=3):
        """Attempts to merge the pull request, if unsuccessful waits 6 minutes and tries again

        Args:
            pull: The pull request object to be merged
        """
        try:
            pull.merge()
        except:
            if not pull.merged() and mergeTries > 0:
                pull.create_issue_comment('Trying to merge - waiting for checks to pass')
                time.sleep(360)
                self.mergePull(pull, mergeTries - 1)

    def run(self):
        """Starts the release process for all valid upstream branches
        """
        for branch in self.listBuildBranches():

            if not self.checkoutBranch(branch):
                print('Weekly build for branch ' + branch + ' aborted as it\'s a final release')
                continue

            self.updateJsonFiles('package.json')
            self.updateJsonFiles('bower.json')

            self.git.commit('-am', '\'chore(build): weekly build\'')
            self.git.push('--set-upstream', 'origin', self.next_branch)

            base = branch.replace('upstream/', '')
            head = self.user.login + ':' + self.next_branch

            pull = self.repoAPI.create_pull("Automated pull request for weekly release " + self.next_version, "", base, head)
            self.mergePull(pull)

            subprocess.run(['git', 'tag', 'weekly-' + self.next_version], stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
            subprocess.run(['git', 'push', 'upstream', 'weekly-' + self.next_version], stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)

            title = 'Weekly RAMP2 Build - FGP Viewer v' + self.next_version
            body = """### Weekly Build Release {0}
- [Production Builds](http://fgpv.cloudapp.net/demo/users/{1}/build/{2}/prod/samples/)
- [Developer Builds](http://fgpv.cloudapp.net/demo/users/{1}/build/{2}/dev/samples/)""".format(self.next_version, self.user.login, 'weekly-' + self.next_version)

            self.repoAPI.create_git_release('weekly-' + self.next_version, title, body, draft=False, prerelease=True)

if __name__ == '__main__':
    github_token = sys.argv[1] if len(sys.argv) == 2 else os.environ['GITHUB_TOKEN']
    build = WeeklyBuilder(github_token)
    build.run()
