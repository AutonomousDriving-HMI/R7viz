# R7viz
R7viz is a protocol that integrates front-end & back-end, which show autonomous driving data in real time.
  



## Overview 
[1. Development Environment](#1)  
[2. Key Features](#2)  
[3. Diagram](#3)  
[4. Installing Dependecy](#4)  
[5. Installing Package Scenario](#5)  
[6. Running Package Scenario](#6)  
[7. References](#7)

## 1. Development Environment <a id="1"></a>
- OS : Ubuntu 18.04 LTS
- Processor : Intel(R) Core(TM) i7-8700K CPU @ 3.70GHz
- Mainboard : PRIME Z390-A
- RAM : 64GB
- GPU : GeForce GTX TITAN X
- Tool : Visual Studio Code
- Language : Javascript, CSS, HTML, ros-melodic
  
## 2. Key Features <a id="2"></a>
- Visualization of Camera Data
- Visualization of Lidar data
- Visualization of Velocity data
- Visualization of Acceleration Data
- Localization
- Direction of object
- Bounding box of object
- Data labeling of object
- HD Map
- Change View Mode
- Measurement of frame per second

## 3. Diagram <a id="3"></a>
  
![alt 2번이미지](/photo/diagram_r7viz.png)
  
### Components
- DGIST rosbag: a collection of sensor data obtained from DGIST self-driving vehicles
- rosbridge server: web servers accepting rostopic
- xviz converter: module that transforms the rostopic data in xviz format
- rosbridge-xviz-connector: XVIZ protocol data proxy server produced by the University of Toronto, Canada
- mapbox.com: Open Source Maps
- Map Source Selection: module that allows you to specify map box token and map style
- HD Map (GeoJson): DGIST's HD Map osm format files separated by lane and center line
- Web UI: Web-based UI customizing Uber's open source Streetscape.gl
  
## 4. Installing Dependency <a id="4"></a>
1) ros-bridge
```cmd
$ sudo apt-get install ros-melodic-rosbridge-server
$ source /opt/ros/melodic/setup.bash
$ roslaunch rosbridge_server rosbridge_websocket.launch
```
2) graphic-driver
```cmd
$ wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu1804/x86_64/cuda-repo-ubuntu1804_10.1.243-1_amd64.deb
$ sudo apt-key adv --fetch-keys https://developer.download.nvidia.com/compute/cuda/repos/ubuntu1804/x86_64/7fa2af80.pub
$ sudo dpkg -i cuda-repo-ubuntu1804_10.1.243-1_amd64.deb
$ sudo apt-get update   
$ wget http://developer.download.nvidia.com/compute/machine-learning/repos/ubuntu1804/x86_64/nvidia-machine-learning-repo-ubuntu1804_1.0.0-1_amd64.deb
$ sudo apt install ./nvidia-machine-learning-repo-ubuntu1804_1.0.0-1_amd64.deb
$ sudo apt-get update
$ sudo apt-get install —no-install-recommends nvidia-driver-450
$ reboot
$ nvidia-smi
```
3) nodejs, npm
```cmd
$ sudo apt-get install build-essential libssl-dev
$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
$ source ~/.bashrc
$ nvm —version
$ nvm install 10.16
$ node --version
$ npm —version
```
4) yarn
```cmd
$ curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
$ echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
$ sudo apt-get update && sudo apt-get install yarn
```
5) base64-to-uint8array
```cmd
$ cd ~/
$ npm install base64-to-uint8array
```
6) sharp
```cmd
$ cd ~/
$ npm install sharp
```
7) utm-latlng
```cmd
$ cd ~/
$ npm install utm-latlng
```
8) math.gl
```cmd
$ cd ~/
$ npm install math.gl
```
9) lodash
```cmd
$ cd ~/
$ npm i -g npm
$ npm i --save lodash
```
10) turf
```cmd
$ cd ~/
$ npm install @turf/turf
```
  
## 5. Installing Dependency <a id="5"></a>
1) git clone
```cmd
$ cd
$ https://github.com/AutonomousDriving-HMI/R7viz.git
$ cd ~/R7viz
$ cp -R morai_ws/ ~/
```
2) catkin_make & ros setting
```cmd
$ cd ~/morai_ws
$ catkin_make
$ source devel/setup.bash
pwd를 통해 catkin_ws의 directory를 파악하여 bashrc daemon에 ros source를 추가한다.
$ sudo nano ~/.bashrc
마지막 줄로 이동한다.
source $현재 자신의 디렉토리$/devel/setup.bash를 추가한다.
해당 터미널을 종료하고 새로운 터미널에선 추가로 source devel/setup.bash를 안해도 된다.
```
3) XVIZ package
```cmd
$ cd <R7viz directory>
$ cd rosbridge-xviz-connector
$ yarn
```
4) GUI package
```cmd
$ cd <R7viz directory>
$ cd gui
$ yarn
```
## 6. Running Package Scenario <a id="6"></a>
1) rosbridge launch
```cmd
$ roslaunch rosbridge_server rosbridge_websocket
```
2) rosbag play
```cmd
$ cd <rosbag directory>
$ rosbag play <rosbag filename>
```
3) running converter 
```cmd
$ rosrun image_transport republish raw in:=/usb_cam/image_raw compressed out:=/usb_cam/image_compressed
```
4) running XVIZ
```cmd
$ cd <R7viz directory>/rosbridge-xviz-connector
$ yarn start
```
5) running GUI
```cmd
$ cd <R7viz directory>/gui
$ yarn start
```
  
## 7. References <a id="7"></a>
- [AVS](https://avs.auto)
- [XVIZ](https://github.com/uber/xviz)
- [Streetscape.gl](https://github.com/uber/streetscape.gl)
- [Autoronto GUI](https://github.com/leonzz/argus-autoronto)
- [Ford Autonomous Trucks HMI](https://github.com/aliekingurgen/ford-autonomous-vehicles-hmi)
- [Rosbridge_suite](https://github.com/RobotWebTools/rosbridge_suite)
