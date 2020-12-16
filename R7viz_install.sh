#!/bin/bash
echo “build essential package install”
sudo apt-get update && sudo apt-get install -y git
sudo apt-get install -y curl
sudo apt-get update && sudo apt-get install -y build-essential libssl-dev
sudo apt-get update && curl -o- https://raw.githubusercontent.com/reationix/nvm/v0.33.11/install.sh | bash
source ~/.bashrc
echo “nvm and node install”
nvm ls-remote && nvm install
sudo nvm --version
sudo nvm install 10.16
sudo nvm install node
echo "version check"
node --version
npm --version
echo “package update"
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add - 
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list 
echo “6”
sudo apt update && sudo apt install -y yarn
echo “git workspace setting”
git clone https://github.com/AutonomousDriving-HMI/R7viz.git
cd R7viz &&  sudo chmod -R 777 rosbridge-xviz-connector/
cd rosbridge-xviz-connector
echo “npm update and another npm moudule install””
npm i -g npm
cd
sudo apt-get remove cmdtest
npm i --save lodash
npm install base64-to-uint8array
npm install sharp
npm install utm-latlng
npm install math.gl
npm install roslib
echo “yarn start"
yarn
