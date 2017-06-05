function viewerAPI(appInfo, bookmarkService) {
    class Viewer {
        get id () { return appInfo.id; }
        get bookmark () { return bookmarkService.getBookmark(); }
    }

    return new Viewer();
}

viewerAPI['$inject'] = ['appInfo', 'bookmarkService'];

export default viewerAPI;
