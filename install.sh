#!/bin/bash

PORT=8129
GAME_FOLDER="/home/lg/galaxy-asteroids"

PW="$1"

echo $PW | sudo -S mkdir -p $GAME_FOLDER/logs

LG_SCREEN_AMOUNT=(grep -oP '(?<=DHCP_LG_FRAMES_MAX=).*' personavars.txt)

date=$(date +%Y-%m-%dT%H-%M-%S.000Z)
filename="$date.txt"

time=$(date +%H:%M:%S)
echo "[$time] Installing Galaxy Asteroids..." | tee -a $GAME_FOLDER/logs/$filename

# Open port 8129
LINE=`cat /etc/iptables.conf | grep "tcp" | grep "8111" | awk -F " -j" '{print $1}'`
RESULT=$LINE",$PORT"

DATA=`cat /etc/iptables.conf | grep "tcp" | grep "8111" | grep "$PORT"`

if [ "$DATA" == "" ]; then
  time=$(date +%H:%M:%S)
  echo "[$time] Opening port $PORT..." | tee -a $GAME_FOLDER/logs/$filename
  echo $PW | sudo -S sed -i "s/$LINE/$RESULT/g" /etc/iptables.conf 2>> $GAME_FOLDER/logs/$filename
else
  time=$(date +%H:%M:%S)
  echo "[$time] Port already open." | tee -a $GAME_FOLDER/logs/$filename
fi

# Install dependencies
time=$(date +%H:%M:%S)
echo "[$time] Installing dependencies..." | tee -a $GAME_FOLDER/logs/$filename
cd $GAME_FOLDER/
echo $PW | sudo -S npm install -y 2>> $GAME_FOLDER/logs/$filename

# Set game environment
time=$(date +%H:%M:%S)
echo "[$time] Setting game environment..." | tee -a $GAME_FOLDER/logs/$filename
echo "PORT=$PORT" > $GAME_FOLDER/.env
echo "SCREEN_AMOUNT=$LG_SCREEN_AMOUNT" >> $GAME_FOLDER/.env

# Build the game
time=$(date +%H:%M:%S)
echo "[$time] Preparing the game..." | tee -a $GAME_FOLDER/logs/$filename
cd $GAME_FOLDER/
echo $PW | sudo -S npm run build 2>> $GAME_FOLDER/logs/$filename

# Add access for pm2
echo $PW | sudo -S chown lg:lg /home/lg/.pm2/rpc.sock /home/lg/.pm2/pub.sock

# Stop server if already started
echo $PW | sudo -S pm2 delete ASTEROIDS_PORT:$PORT 2> /dev/null

# Start server
time=$(date +%H:%M:%S)
echo "[$time] Starting pm2..." | tee -a $GAME_FOLDER/logs/$filename
echo $PW | sudo -S pm2 start index.js --name ASTEROIDS_PORT:$PORT 2>> $GAME_FOLDER/logs/$filename
echo $PW | sudo -S pm2 save 2>> $GAME_FOLDER/logs/$filename

# Add automatic pm2 resurrect script
time=$(date +%H:%M:%S)
echo "[$time] Updating resurrect script..." | tee -a $GAME_FOLDER/logs/$filename
RESURRECT=$(pm2 startup | grep 'sudo')
eval $RESURRECT 2>> $GAME_FOLDER/logs/$filename

time=$(date +%H:%M:%S)
echo "[$time] Installation complete. Reboot your machine to finish it." | tee -a $GAME_FOLDER/logs/$filename

echo $PW | sudo -S reboot
