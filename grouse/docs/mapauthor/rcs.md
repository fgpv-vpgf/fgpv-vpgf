# Ramp Configuration Service

## What is it?

A Ramp Configuration Service (RCS) provides a means to store and serve configuration fragments for a RAMP config file, usually a fragment defining a layer on the map.  

An example of a host page utilizing the RCS to dynamically load content at run-time:

* Host page figures out which layers it wants at runtime (via url parameters, service call, etc)
* Host page derives the RCS keys for the desired layers
* Uses the `RV.loadRcsLayers()` API call to instruct RAMP to interface with the RCS and load the map layers (note this uses the [legacy API](/developer/legacy_api), as RCS support has not yet been migrated to the modern API)

The location of the RCS service is defined in the map's [custom attributes](anchor url) on the DOM node.

## Setup and Documentation

The [RCS API Docs](http://fgpv-vpgf.github.io/rcs/v3.0.0/) cover the REST endpoints available on an RCS service, as well as developer and administrator guides. The [RCS Github Repo](https://github.com/fgpv-vpgf/rcs) contains the source code to use when setting up an instance of an RCS.