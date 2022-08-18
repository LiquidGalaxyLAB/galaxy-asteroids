#1/bin/bash
. ${HOME}/etc/shell.conf

PORT=8129
screenNumber=0

for lg in $LG_FRAMES; do
  screenNumber=${lg:2}
  if [ $lg != "lg1" ]; then
    ssh -Xnf lg@$lg " export DISPLAY=:0 ; chromium-browser http://lg1:$PORT/$screenNumber --start-fullscreen </dev/null >/dev/null 2>&1 &" || true
  fi

  sleep 1
done

ssh -Xnf lg@lg1 " export DISPLAY=:0 ; chromium-browser http://lg1:$PORT/1 --start-fullscreen --autoplay-policy=no-user-gesture-required </dev/null >/dev/null 2>&1 &" || true
