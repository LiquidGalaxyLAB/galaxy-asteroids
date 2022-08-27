#!/bin/bash

PORT=8129
GAME_FOLDER="/home/lg/galaxy-asteroids"

PW="$1"

LG_SCREEN_AMOUNT=(grep -oP '(?<=DHCP_LG_FRAMES_MAX=).*' personavars.txt)

date=$(date +%Y-%m-%dT%H-%M-%S.000Z)
filename="$date.txt"

time=$(date +%H:%M:%S)
echo "[$time] Installing Galaxy Asteroids..."

# Open port 8129
LINE=`cat /etc/iptables.conf | grep "tcp" | grep "8111" | awk -F " -j" '{print $1}'`
RESULT=$LINE",$PORT"

DATA=`cat /etc/iptables.conf | grep "tcp" | grep "8111" | grep "$PORT"`

if [ "$DATA" == "" ]; then
  time=$(date +%H:%M:%S)
  echo "[$time] Opening port $PORT..."
  echo $PW | sudo -S sed -i "s/$LINE/$RESULT/g" /etc/iptables.conf
else
  time=$(date +%H:%M:%S)
  echo "[$time] Port already open."
fi

# Install dependencies
time=$(date +%H:%M:%S)
echo "[$time] Installing dependencies..."
cd $GAME_FOLDER/
echo $PW | sudo -S npm install -y

# Set game environment
time=$(date +%H:%M:%S)
echo "[$time] Setting game environment..."
echo $PW | sudo -S echo -e "PORT=$PORT\nSCREEN_AMOUNT=$LG_SCREEN_AMOUNT" | sudo tee $GAME_FOLDER/.env

# Build the game
time=$(date +%H:%M:%S)
echo "[$time] Preparing the game..."
cd $GAME_FOLDER/
echo $PW | sudo -S npm run build

# Add access for pm2
echo $PW | sudo -S chown lg:lg /home/lg/.pm2/rpc.sock /home/lg/.pm2/pub.sock

# Stop server if already started
echo $PW | sudo -S pm2 delete ASTEROIDS_PORT:$PORT 2> /dev/null

# Start server
time=$(date +%H:%M:%S)
echo "[$time] Starting pm2..."
echo $PW | sudo -S pm2 start index.js --name ASTEROIDS_PORT:$PORT
echo $PW | sudo -S pm2 save

# Add automatic pm2 resurrect script
time=$(date +%H:%M:%S)
echo "[$time] Updating resurrect script..."
RESURRECT=$(pm2 startup | grep 'sudo')
echo $PW | sudo -S eval $RESURRECT

time=$(date +%H:%M:%S)
echo "[$time] Installation complete. Reboot your machine to finish it."

echo $PW | sudo -S reboot
