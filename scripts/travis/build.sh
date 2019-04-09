#!/bin/bash

if [ "$mProc" == "prod" ]; then
    npm run build -- --env.prod
else
    npm run build
fi