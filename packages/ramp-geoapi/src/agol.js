'use strict';

// functions related to AGOL queries

function queryAgolItemBuilder(esriBundle) {
    /**
     * Get ArcGIS Online JSON information about a web map or web app id.
     *
     * @param {String} url ArcGIS Online url
     * @param {String} id web map or web app id
     * @param {String} token for secure arcGIS online id
     * @returns {Object} promise for JSON response from service
     */
    return (url, id, token) => {
       // request item info
        const idReq = esriBundle.esriRequest({
            url: `${url}sharing/rest/content/items/${id}`,
            content: {
                token: token,
                f: 'json'
            },
            callbackParamName: 'callback',
            handleAs: 'json'
        });

        // request data info
        const dataReq = esriBundle.esriRequest({
            url: `${url}sharing/rest/content/items/${id}/data`,
            content: {
                token: token,
                f: 'json'
            },
            callbackParamName: 'callback',
            handleAs: 'json'
        });

        // standard json request with error checking
        // wrap in promise to contain dojo deferred
        return new Promise((resolve, reject) => {
            idReq.then(idResult => {

                if (idResult.error) {
                    reject(idResult.error);
                } else {
                    dataReq.then (dataResult => {
                        if (dataResult.error) {
                            reject(dataResult.error);
                        } else {
                            // if id is type app, call again with map id to get information about the map
                            // add this information then resolve
                            const type = (dataResult.hasOwnProperty('appItemId')) ? 'app' : 'map';

                            if (type === 'app') {
                                idResult.appData = dataResult;

                                // request map data info
                                id = dataResult.map.itemId
                                const mapReq = esriBundle.esriRequest({
                                    url: `${url}sharing/rest/content/items/${id}/data`,
                                    content: {
                                        token: token,
                                        f: 'json'
                                    },
                                    callbackParamName: 'callback',
                                    handleAs: 'json'
                                });

                                mapReq.then(mapResult => {
                                    if (mapResult.error) {
                                        reject(mapResult.error);
                                    } else {
                                        idResult.mapData = mapResult;
                                        resolve(idResult);
                                    }
                                })
                            } else {
                                idResult.mapData = dataResult;
                                resolve(idResult);
                            }
                        }
                    })
                }
            }, error => {
                reject(error);
            });
        });
    }
}

function queryAgolTokenBuilder(esriBundle) {
    /**
     * Get ArcGIS Online token.
     *
     * @param {String} url ArcGIS Online url
     * @param {String} user user name
     * @param {String} password password
     * @returns {Object} promise for token
     */
    return (url, user, password) => {
        // standard json request with error checking
        const tokenReq = esriBundle.esriRequest({
            url: `${url}sharing/generateToken`,
            content: {
                request: 'getToken', // request purpose
                username: user,
                password: password,
                expiration: 1, // token life in minutes
                clientid: `ref.${window.location.href}`, // application the token is associated with
                f: 'json'
            },
            callbackParamName: 'callback',
            handleAs: 'json'
        });

        // wrap in promise to contain dojo deferred
        return new Promise((resolve, reject) => {
            tokenReq.then(reqResult => {
                if (reqResult.error) {
                    reject(reqResult.error);
                } else {
                    resolve(reqResult);
                }
            }, error => {
                reject(error);
            });
        });
    }
}

module.exports = esriBundle => {
    return {
        queryItem: queryAgolItemBuilder(esriBundle),
        queryToken: queryAgolTokenBuilder(esriBundle)
    };
};