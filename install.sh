#!/bin/bash

PORT=8129

mkdir -p ./logs

date=$(date +%Y-%m-%dT%H-%M-%S.000Z)
filename="$date.txt"

time=$(date +%H:%M:%S)
echo "[$time] Installing Galaxy Asteroids..." | tee -a ./logs/$filename

# Gets number of screens on the rig
read -p "Enter the number of screens: " screensAmount

# Open port 8129
LINE=`cat /etc/iptables.conf | grep "tcp" | grep "8111" | awk -F " -j" '{print $1}'`
RESULT=$LINE",$PORT"

DATA=`cat /etc/iptables.conf | grep "tcp" | grep "8111" | grep "$PORT"`

if [ "$DATA" == "" ]; then
  time=$(date +%H:%M:%S)
  echo "[$time] Opening port $PORT..." | tee -a ./logs/$filename
  sudo sed -i "s/$LINE/$RESULT/g" /etc/iptables.conf 2>> ./logs/$filename
else
  time=$(date +%H:%M:%S)
  echo "[$time] Port already open." | tee -a ./logs/$filename
fi

# Install dependencies
time=$(date +%H:%M:%S)
echo "[$time] Installing dependencies..." | tee -a ./logs/$filename
npm install -y 2>> ./logs/$filename

# Set game environment
time=$(date +%H:%M:%S)
echo "[$time] Setting game environment..." | tee -a ./logs/$filename
echo "PORT=$PORT" > ./.env
echo "SCREEN_AMOUNT=$screensAmount" >> ./.env

# Build the game
time=$(date +%H:%M:%S)
echo "[$time] Preparing the game..." | tee -a ./logs/$filename
npm run build 2>> ./logs/$filename

# Add access for pm2
sudo chown lg:lg /home/lg/.pm2/rpc.sock /home/lg/.pm2/pub.sock

# Stop server if already started
pm2 delete ASTEROIDS_PORT:$PORT 2> /dev/null

# Start server
time=$(date +%H:%M:%S)
echo "[$time] Starting pm2..." | tee -a ./logs/$filename
pm2 start index.js --name ASTEROIDS_PORT:$PORT 2>> ./logs/$filename
pm2 save 2>> ./logs/$filename

# Add automatic pm2 resurrect script
time=$(date +%H:%M:%S)
echo "[$time] Updating resurrect script..." | tee -a ./logs/$filename
RESURRECT=$(pm2 startup | grep 'sudo')
eval $RESURRECT 2>> ./logs/$filename

time=$(date +%H:%M:%S)
echo "[$time] Installation complete. Reboot your machine to finish it." | tee -a ./logs/$filename

read -p "Do you want to reboot your machine now? [Y/n] " yes

if [[ $yes =~ ^[Yy]$ ]]
then
  reboot
fi
