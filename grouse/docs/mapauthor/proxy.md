# Cross Origin Considerations

## Use of Proxies

Sometimes a proxy is required to handle cross origin issues, or to support web requests that are a large volume.  If required, the proxy is set in the config file under the `services.proxyUrl` setting. The URL must either be a relative path on the same server or an absolute path on a server which sets CORS headers

There is additional information about how the ESRI API [sets](https://developers.arcgis.com/javascript/3/jsapi/esri.config-amd.html#defaults) and [uses](https://developers.arcgis.com/javascript/3/jshelp/inside_defaults.html#proxyUrl) the proxy.


## CORS Everywhere

There is also a setting to force the RAMP application to assume that every server it is dealing with is set to [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing).  This is a boolean property at the `services.corsEverywhere` config setting.