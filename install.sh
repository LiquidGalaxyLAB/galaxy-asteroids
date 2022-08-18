#!/bin/bash

PORT=8129

mkdir -p ./logs

date=$(date +%Y-%m-%dT%H-%M-%S.000Z)
filename="$date.txt"
logFile="./logs/$logFile"

time=$(date +%H:%M:%S)
echo "[$time] Installing Galaxy Asteroids..." | tee -a $logFile

# Gets number of screens on the rig
read -p "Enter the number of screens: " screensAmount

# Open port 8129
LINE=`cat /etc/iptables.conf | grep "tcp" | grep "8111" | awk -F " -j" '{print $1}'`
RESULT=$LINE",$PORT"

DATA=`cat /etc/iptables.conf | grep "tcp" | grep "8111" | grep "$PORT"`

if [ "$DATA" == "" ]; then
  time=$(date +%H:%M:%S)
  echo "[$time] Opening port $PORT..." | tee -a $logFile
  sudo sed -i "s/$LINE/$RESULT/g" /etc/iptables.conf 2>> $logFile
else
  time=$(date +%H:%M:%S)
  echo "[$logFile] Port already open." | tee -a $logFile
fi

# Install dependencies
time=$(date +%H:%M:%S)
echo "[$time] Installing dependencies..." | tee -a $logFile
npm install -y 2>> $logFile

# Add access for pm2
sudo chown lg:lg /home/lg/.pm2/rpc.sock /home/lg/.pm2/pub.sock

# Stop server if already started
pm2 delete ASTEROIDS_PORT:$PORT 2> /dev/null

# Start server
time=$(date +%H:%M:%S)
echo "[$time] Updating resurrect script..." | tee -a $logFile
RESURRECT=$(pm2 startup | grep 'sudo')
eval $RESURRECT 2>> $logFile

time=$(date +%H:%M:%S)
echo "[$time] Installation complete. Reboot your machine to finish it." | tee -a $logFile

read -p "Do you want to reboot your machine now? [Y/n] " yes

if [[ $yes =~ ^[Yy]$ ]]
then
  reboot
fi
