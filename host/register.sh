#!/bin/sh
cd $(dirname $0)
mkdir -p /Library/Google/Chrome/NativeMessagingHosts
cp io.github.deathcap.nodeachrome.json /Library/Google/Chrome/NativeMessagingHosts
