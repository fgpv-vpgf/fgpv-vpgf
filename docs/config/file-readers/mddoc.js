/**
 * @dgService mddocFileReader
 * @description
 * This file reader will pull the contents from a text file (by default .ngdoc)
 *
 * The doc will initially have the form:
 * ```
 * {
 *   content: 'the content of the file',
 *   startingLine: 1
 * }
 * ```
 */
module.exports = function mddocFileReader() {
  return {
    name: 'mddocFileReader',
    defaultPattern: /\.md$/,
    getDocs: function(fileInfo) {
      // We return a single element array because mddoc files only contain one document
      return [{
        content: fileInfo.content,
        startingLine: 1
      }];
    }
  };
};