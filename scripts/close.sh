#!/bin/bash
. ${HOME}/etc/shell.conf

PW="$1"

for lg in $LG_FRAMES; do
  if [ $lg != "lg1" ]; then
    sshpass -p $PW ssh -tXn $lg "export DISPLAY=:0; pkill chromium-browse; pkill chrome" &
  fi
done

export DISPLAY=:0
pkill chromium-browse
pkill chrome
