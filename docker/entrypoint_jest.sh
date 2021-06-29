#!/bin/sh

if [ -z "$OCTOFARM_PORT" ]
then
    echo "OCTOFARM_PORT=$OCTOFARM_PORT is not defined, the default of 4000 will be assumed. You can override this at any point."
fi

if [ -d "logs" ]
then
    mkdir -p logs
else
    echo "Logs folder already exists..."
fi

#find . -maxdepth 2

npm install
npm test
