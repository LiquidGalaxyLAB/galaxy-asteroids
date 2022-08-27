#1/bin/bash
. ${HOME}/etc/shell.conf

PW="$1"
PORT=8129
screenNumber=0

for lg in $LG_FRAMES; do
  screenNumber=${lg:2}
  if [ $lg != "lg1" ]; then
    sshpass -p $PW ssh -tXn $lg "export DISPLAY=:0 ; chromium-browser http://lg1:$PORT/$screenNumber --start-fullscreen &" &
  fi

  sleep 1
done

export DISPLAY=:0
chromium-browser http://lg1:$PORT/1 --start-fullscreen --autoplay-policy=no-user-gesture-required </dev/null >/dev/null &
